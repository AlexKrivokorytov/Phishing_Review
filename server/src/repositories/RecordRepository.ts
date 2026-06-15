import type { Database } from 'better-sqlite3';
import type { Record, RecordWithTags, Tag, UpdateRecordDto, RecordFilters } from '../types/record.types';

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

  /**
   * Fetches all records with their associated tags in a single SQL query.
   * Uses LEFT JOIN + GROUP_CONCAT to avoid the N+1 query problem.
   * Each row's `tags_raw` column looks like "1:brand_impersonation|3:credential_form".
   */
  public findAllWithTags(filters: RecordFilters = {}): RecordWithTags[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      conditions.push('r.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      const terms = filters.search.trim().split(/\s+/);
      const ftsQuery = terms.map((t) => `"${t}"`).join(' ');
      conditions.push('r.rowid IN (SELECT rowid FROM records_fts WHERE records_fts MATCH ?)');
      params.push(ftsQuery);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT
        r.*,
        GROUP_CONCAT(t.id || ':' || t.name, '|') AS tags_raw
      FROM records r
      LEFT JOIN record_evidence_tags ret ON ret.record_id = r.id
      LEFT JOIN tags t ON t.id = ret.tag_id
      ${where}
      GROUP BY r.id
      ORDER BY r.imported_at DESC
    `;

    type RawRow = Record & { tags_raw: string | null };

    return (this.db.prepare(query).all(...params) as RawRow[]).map((row) => {
      const tags: Tag[] = row.tags_raw
        ? row.tags_raw.split('|').map((part) => {
            const [id, ...nameParts] = part.split(':');
            return { id: Number(id), name: nameParts.join(':') };
          })
        : [];

      const { tags_raw: _, ...record } = row;
      return { ...record, tags };
    });
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
    const row = this.db.prepare(`
      SELECT
        COUNT(*)                                         AS total,
        COUNT(CASE WHEN status = 'new'      THEN 1 END) AS new_count,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) AS reviewed_count,
        COUNT(CASE WHEN label  = 'phishing' THEN 1 END) AS phishing_count
      FROM records
    `).get() as { total: number; new_count: number; reviewed_count: number; phishing_count: number };

    return {
      total:    row.total,
      new:      row.new_count,
      reviewed: row.reviewed_count,
      phishing: row.phishing_count,
    };
  }
}
