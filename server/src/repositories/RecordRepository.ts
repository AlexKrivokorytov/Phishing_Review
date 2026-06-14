import type { Database } from 'better-sqlite3';
import type { Record, UpdateRecordDto, RecordFilters } from '../types/record.types';

export class RecordRepository {
  constructor(private readonly db: Database) {}

  public findAll(filters: RecordFilters = {}): Record[] {
    let query = 'SELECT * FROM records';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      const terms = filters.search.trim().split(/\s+/);
      const ftsQuery = terms.map((t) => `"${t}"`).join(' ');
      conditions.push('rowid IN (SELECT rowid FROM records_fts WHERE records_fts MATCH ?)');
      params.push(ftsQuery);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY imported_at DESC';
    return this.db.prepare(query).all(...params) as Record[];
  }

  public findById(id: string): Record | undefined {
    return this.db.prepare('SELECT * FROM records WHERE id = ?').get(id) as Record | undefined;
  }

  /** ON CONFLICT DO NOTHING skips duplicates silently and returns 0 changes. */
  public insert(record: Record): number {
    return this.db.prepare(`
      INSERT INTO records (id, url_or_email, source, date_collected, label, status, notes, imported_at, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url_or_email) DO NOTHING
    `).run(
      record.id, record.url_or_email, record.source, record.date_collected,
      record.label, record.status, record.notes, record.imported_at, record.reviewed_at,
    ).changes;
  }

  /** Sets reviewed_at when a record leaves 'new' status for the first time. */
  public update(id: string, dto: UpdateRecordDto): number {
    const current = this.findById(id);
    if (!current) return 0;

    const updates: string[] = [];
    const params: unknown[] = [];

    const leavingNew = dto.status && current.status === 'new' && dto.status !== 'new';

    if (dto.label !== undefined) { updates.push('label = ?'); params.push(dto.label); }
    if (dto.status !== undefined) { updates.push('status = ?'); params.push(dto.status); }
    if (dto.notes !== undefined) { updates.push('notes = ?'); params.push(dto.notes); }

    if (leavingNew) {
      updates.push('reviewed_at = ?');
      params.push(new Date().toISOString());
    } else if (dto.status === 'new') {
      updates.push('reviewed_at = ?');
      params.push(null);
    }

    if (updates.length === 0) return 0;

    params.push(id);
    return this.db.prepare(`UPDATE records SET ${updates.join(', ')} WHERE id = ?`).run(...params).changes;
  }

  public getCounts(): { total: number; new: number; reviewed: number; phishing: number } {
    const n = (sql: string) => (this.db.prepare(sql).get() as { cnt: number }).cnt;

    return {
      total:    n('SELECT COUNT(*) as cnt FROM records'),
      new:      n("SELECT COUNT(*) as cnt FROM records WHERE status = 'new'"),
      reviewed: n("SELECT COUNT(*) as cnt FROM records WHERE status = 'reviewed'"),
      phishing: n("SELECT COUNT(*) as cnt FROM records WHERE label = 'phishing'"),
    };
  }
}
