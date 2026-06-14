import type { Database } from 'better-sqlite3';
import type {
  Record,
  UpdateRecordDto,
  RecordFilters,
} from '../types/record.types';

/**
 * Repository for managing records table operations.
 */
export class RecordRepository {
  constructor(private readonly db: Database) {}

  /**
   * Fetches records based on filters.
   *
   * @param filters - Filtering options.
   * @returns List of records.
   */
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

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Record[];
  }

  /**
   * Finds a single record by its ID.
   *
   * @param id - Record UUID.
   * @returns Found record or undefined.
   */
  public findById(id: string): Record | undefined {
    const stmt = this.db.prepare('SELECT * FROM records WHERE id = ?');
    return stmt.get(id) as Record | undefined;
  }

  /**
   * Inserts a new record, skipping duplicate url_or_emails.
   *
   * @param record - Record to insert.
   * @returns Affected row count.
   */
  public insert(record: Record): number {
    const stmt = this.db.prepare(`
      INSERT INTO records (id, url_or_email, source, date_collected, label, status, notes, imported_at, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url_or_email) DO NOTHING
    `);
    const result = stmt.run(
      record.id,
      record.url_or_email,
      record.source,
      record.date_collected,
      record.label,
      record.status,
      record.notes,
      record.imported_at,
      record.reviewed_at
    );
    return result.changes;
  }

  /**
   * Updates fields of a record. Automatically tracks the review timestamp when status updates.
   *
   * @param id - Record UUID.
   * @param dto - Data fields to update.
   * @returns Affected row count.
   */
  public update(id: string, dto: UpdateRecordDto): number {
    const current = this.findById(id);
    if (!current) {
      return 0;
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    let isTransitioningFromNew = false;
    if (dto.status && current.status === 'new' && dto.status !== 'new') {
      isTransitioningFromNew = true;
    }

    if (dto.label !== undefined) {
      updates.push('label = ?');
      params.push(dto.label);
    }

    if (dto.status !== undefined) {
      updates.push('status = ?');
      params.push(dto.status);
    }

    if (dto.notes !== undefined) {
      updates.push('notes = ?');
      params.push(dto.notes);
    }

    if (isTransitioningFromNew) {
      updates.push('reviewed_at = ?');
      params.push(new Date().toISOString());
    } else if (dto.status === 'new') {
      updates.push('reviewed_at = ?');
      params.push(null);
    }

    if (updates.length === 0) {
      return 0;
    }

    params.push(id);
    const stmt = this.db.prepare(`UPDATE records SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    return result.changes;
  }

  /**
   * Retrieves summary counts for records.
   *
   * @returns Object with counts.
   */
  public getCounts(): { total: number; new: number; reviewed: number; phishing: number } {
    const total = (this.db.prepare('SELECT COUNT(*) as cnt FROM records').get() as { cnt: number }).cnt;
    const newCount = (this.db.prepare("SELECT COUNT(*) as cnt FROM records WHERE status = 'new'").get() as { cnt: number }).cnt;
    const reviewedCount = (this.db.prepare("SELECT COUNT(*) as cnt FROM records WHERE status = 'reviewed'").get() as { cnt: number }).cnt;
    const phishingCount = (this.db.prepare("SELECT COUNT(*) as cnt FROM records WHERE label = 'phishing'").get() as { cnt: number }).cnt;

    return {
      total,
      new: newCount,
      reviewed: reviewedCount,
      phishing: phishingCount,
    };
  }
}
