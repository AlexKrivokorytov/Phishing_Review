import type { Database } from 'better-sqlite3';
import type { Tag } from '../types/record.types';

export class TagRepository {
  constructor(private readonly db: Database) {}

  public findAll(): Tag[] {
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
  }

  public findByRecordId(recordId: string): Tag[] {
    return this.db.prepare(`
      SELECT t.id, t.name
      FROM record_evidence_tags ret
      JOIN tags t ON ret.tag_id = t.id
      WHERE ret.record_id = ?
      ORDER BY t.name
    `).all(recordId) as Tag[];
  }

  /** Replaces all tags for a record atomically: deletes existing, inserts new. */
  public setTagsForRecord(recordId: string, tagIds: number[]): void {
    const del = this.db.prepare('DELETE FROM record_evidence_tags WHERE record_id = ?');
    const ins = this.db.prepare('INSERT INTO record_evidence_tags (record_id, tag_id) VALUES (?, ?)');

    this.db.transaction((id: string, ids: number[]) => {
      del.run(id);
      for (const tagId of ids) ins.run(id, tagId);
    })(recordId, tagIds);
  }
}
