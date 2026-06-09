import type { Database } from 'better-sqlite3';
import type { Tag } from '../types/record.types';

/**
 * Repository for managing dictionary tags and record tag associations.
 */
export class TagRepository {
  constructor(private readonly db: Database) {}

  /**
   * Retrieves all dictionary tags.
   *
   * @returns List of all tags.
   */
  public findAll(): Tag[] {
    const stmt = this.db.prepare('SELECT * FROM tags ORDER BY name');
    return stmt.all() as Tag[];
  }

  /**
   * Retrieves tags associated with a specific record ID.
   *
   * @param recordId - Record UUID.
   * @returns Associated tags list.
   */
  public findByRecordId(recordId: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.id, t.name
      FROM record_evidence_tags ret
      JOIN tags t ON ret.tag_id = t.id
      WHERE ret.record_id = ?
      ORDER BY t.name
    `);
    return stmt.all(recordId) as Tag[];
  }

  /**
   * Updates tags list associated with a record.
   *
   * @param recordId - Record UUID.
   * @param tagIds - List of tag IDs to assign.
   */
  public setTagsForRecord(recordId: string, tagIds: number[]): void {
    const deleteStmt = this.db.prepare('DELETE FROM record_evidence_tags WHERE record_id = ?');
    const insertStmt = this.db.prepare('INSERT INTO record_evidence_tags (record_id, tag_id) VALUES (?, ?)');

    const runTransaction = this.db.transaction((id: string, ids: number[]) => {
      deleteStmt.run(id);
      for (const tagId of ids) {
        insertStmt.run(id, tagId);
      }
    });

    runTransaction(recordId, tagIds);
  }
}
