import Database from 'better-sqlite3';
import type { Record, RecordWithTags, Tag, UpdateRecordDto, RecordFilters } from '../types/record.types';

type RawRow = Record & { tags_raw: string | null };

export class RecordRepository {
  private readonly findByIdStmt: Database.Statement<[string]>;
  private readonly insertStmt: Database.Statement<
    [
      string,
      string,
      string,
      string,
      string | null,
      string,
      string,
      string,
      string | null,
    ]
  >;
  private readonly getCountsStmt: Database.Statement<[]>;

  constructor(private readonly db: Database.Database) {
    this.findByIdStmt = this.db.prepare("SELECT * FROM records WHERE id = ?");
    this.insertStmt = this.db.prepare(`
      INSERT INTO records (id, url_or_email, source, date_collected, label, status, notes, imported_at, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url_or_email) DO NOTHING
    `);
    this.getCountsStmt = this.db.prepare(`
      SELECT
        COUNT(*)                                                      AS total,
        COUNT(CASE WHEN status = 'new'                 THEN 1 END)   AS new_count,
        COUNT(CASE WHEN status = 'reviewed'            THEN 1 END)   AS reviewed_count,
        COUNT(CASE WHEN status = 'needs_second_review' THEN 1 END)   AS needs_second_review_count,
        COUNT(CASE WHEN label  = 'phishing'            THEN 1 END)   AS phishing_count
      FROM records
    `);
  }

  // Gets total count of records matching the filters.
  public countAllWithTags(filters: RecordFilters = {}): number {
    const { conditions, params } = this.buildFilters(filters);
    const where =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const query = `
      SELECT COUNT(*) as count
      FROM records r
      ${where}
    `;
    const result = this.db.prepare(query).get(...params) as { count: number };
    return result.count;
  }

  // Helper to build SQL conditions from filters
  private buildFilters(filters: RecordFilters): {
    conditions: string[];
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      conditions.push("r.status = ?");
      params.push(filters.status);
    }

    if (filters.label) {
      conditions.push("r.label = ?");
      params.push(filters.label);
    }

    if (filters.search) {
      const cleanSearch = filters.search.replace(/[^a-zA-Z0-9\s@._-]/g, " ");
      const terms = cleanSearch.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        const ftsQuery = terms.map((t) => `"${t}"*`).join(" ");
        conditions.push(
          "r.rowid IN (SELECT rowid FROM records_fts WHERE records_fts MATCH ?)",
        );
        params.push(ftsQuery);
      }
    }
    return { conditions, params };
  }

  // Gets all records from the database including their tags.
  // Uses a LEFT JOIN to load everything in one SQL query (no N+1 query issue).
  public findAllWithTags(filters: RecordFilters = {}): RecordWithTags[] {
    const { conditions, params } = this.buildFilters(filters);

    let limitClause = "";
    if (filters.limit !== undefined) {
      const page = filters.page || 1;
      const offset = (page - 1) * filters.limit;
      limitClause = `LIMIT ? OFFSET ?`;
      params.push(filters.limit, offset);
    }

    const where =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

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
      ${limitClause}
    `;

    return (this.db.prepare(query).all(...params) as RawRow[]).map((row) =>
      this.mapRowToRecordWithTags(row),
    );
  }

  // Finds a record by its ID. Returns undefined if not found.
  public findById(id: string): Record | undefined {
    return this.findByIdStmt.get(id) as Record | undefined;
  }

  // Finds a record by its ID together with its tags in one query.
  public findByIdWithTags(id: string): RecordWithTags | undefined {
    const query = `
      SELECT
        r.*,
        GROUP_CONCAT(t.id || ':' || t.name, '|') AS tags_raw
      FROM records r
      LEFT JOIN record_evidence_tags ret ON ret.record_id = r.id
      LEFT JOIN tags t ON t.id = ret.tag_id
      WHERE r.id = ?
      GROUP BY r.id
    `;

    const row = this.db.prepare(query).get(id) as RawRow | undefined;
    return row ? this.mapRowToRecordWithTags(row) : undefined;
  }

  // Inserts a record. If the url_or_email already exists, it is skipped.
  public insert(record: Record): number {
    return this.insertStmt.run(
      record.id,
      record.url_or_email,
      record.source,
      record.date_collected,
      record.label,
      record.status,
      record.notes,
      record.imported_at,
      record.reviewed_at,
    ).changes;
  }

  // Inserts multiple records in a single database transaction for high speed.
  // Returns the number of successfully inserted records.
  public insertMany(records: Record[]): number {
    const transaction = this.db.transaction((list: Record[]) => {
      let inserted = 0;
      for (const record of list) {
        inserted += this.insertStmt.run(
          record.id,
          record.url_or_email,
          record.source,
          record.date_collected,
          record.label,
          record.status,
          record.notes,
          record.imported_at,
          record.reviewed_at,
        ).changes;
      }
      return inserted;
    });
    return transaction(records);
  }

  // Updates fields of a record (label, status, notes).
  // Sets reviewed_at timestamp if the record leaves 'new' status.
  public update(id: string, dto: UpdateRecordDto): number {
    const current = this.findById(id);
    if (!current) return 0;

    const updates: string[] = [];
    const params: unknown[] = [];

    const leavingNew =
      dto.status && current.status === "new" && dto.status !== "new";

    if (dto.label !== undefined) {
      updates.push("label = ?");
      params.push(dto.label);
    }
    if (dto.status !== undefined) {
      updates.push("status = ?");
      params.push(dto.status);
    }
    if (dto.notes !== undefined) {
      updates.push("notes = ?");
      params.push(dto.notes);
    }

    if (leavingNew) {
      updates.push("reviewed_at = ?");
      params.push(new Date().toISOString());
    } else if (dto.status === "new") {
      updates.push("reviewed_at = ?");
      params.push(null);
    }

    if (updates.length === 0) return 0;

    params.push(id);
    return this.db
      .prepare(`UPDATE records SET ${updates.join(", ")} WHERE id = ?`)
      .run(...params).changes;
  }

  private mapRowToRecordWithTags(row: RawRow): RecordWithTags {
    const tags: Tag[] = row.tags_raw
      ? row.tags_raw.split("|").map((part) => {
          const [id, ...nameParts] = part.split(":");
          return { id: Number(id), name: nameParts.join(":") };
        })
      : [];

    const { tags_raw: _, ...record } = row;
    return { ...record, tags };
  }

  // Gets counts for all records, new records, reviewed records, needs review, and phishing records.
  public getCounts(): {
    total: number;
    new: number;
    reviewed: number;
    needs_second_review: number;
    phishing: number;
  } {
    const row = this.getCountsStmt.get() as {
      total: number;
      new_count: number;
      reviewed_count: number;
      needs_second_review_count: number;
      phishing_count: number;
    };

    return {
      total: row.total,
      new: row.new_count,
      reviewed: row.reviewed_count,
      needs_second_review: row.needs_second_review_count,
      phishing: row.phishing_count,
    };
  }
}
