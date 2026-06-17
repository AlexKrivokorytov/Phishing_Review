import Database from 'better-sqlite3';
import type { Tag } from '../types/record.types';

export class TagRepository {
  private readonly findAllStmt: Database.Statement<[]>;
  private readonly findByRecordIdStmt: Database.Statement<[string]>;
  private readonly delStmt: Database.Statement<[string]>;
  private readonly insStmt: Database.Statement<[string, number]>;

  constructor(private readonly db: Database.Database) {
    this.findAllStmt = this.db.prepare('SELECT * FROM tags ORDER BY name');
    this.findByRecordIdStmt = this.db.prepare(`
      SELECT t.id, t.name
      FROM record_evidence_tags ret
      JOIN tags t ON ret.tag_id = t.id
      WHERE ret.record_id = ?
      ORDER BY t.name
    `);
    this.delStmt = this.db.prepare('DELETE FROM record_evidence_tags WHERE record_id = ?');
    this.insStmt = this.db.prepare('INSERT INTO record_evidence_tags (record_id, tag_id) VALUES (?, ?)');
  }

  // Gets all available tags. Sorted by name.
  public findAll(): Tag[] {
    return this.findAllStmt.all() as Tag[];
  }

  // Gets all tags attached to a specific record. Sorted by name.
  public findByRecordId(recordId: string): Tag[] {
    return this.findByRecordIdStmt.all(recordId) as Tag[];
  }

  // Updates tags for a record. Deletes old tags and inserts new ones in a transaction.
  public setTagsForRecord(recordId: string, tagIds: number[]): void {
    this.db.transaction((id: string, ids: number[]) => {
      this.delStmt.run(id);
      for (const tagId of ids) this.insStmt.run(id, tagId);
    })(recordId, tagIds);
  }
}
