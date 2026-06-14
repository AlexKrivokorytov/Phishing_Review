import { describe, it, expect, beforeEach } from 'vitest';
import { TagRepository } from '../../src/repositories/TagRepository';
import { RecordRepository } from '../../src/repositories/RecordRepository';
import db, { initDB } from '../../src/db';
import { randomUUID } from 'crypto';

process.env.NODE_ENV = 'test';

describe('TagRepository', () => {
  let tagRepo: TagRepository;
  let recordRepo: RecordRepository;

  const insertRecord = () => {
    const id = randomUUID();
    recordRepo.insert({
      id,
      url_or_email: `http://test-${id}.example.com`,
      source: 'manual',
      date_collected: '2026-01-01',
      imported_at: new Date().toISOString(),
      label: null,
      status: 'new',
      notes: '',
      reviewed_at: null,
    });
    return id;
  };

  beforeEach(() => {
    initDB();
    tagRepo = new TagRepository(db);
    recordRepo = new RecordRepository(db);
    db.prepare('DELETE FROM records').run();
  });

  it('findAll returns the seeded tags', () => {
    const tags = tagRepo.findAll();
    expect(tags.length).toBeGreaterThanOrEqual(5);
    expect(tags.every((t) => typeof t.id === 'number' && typeof t.name === 'string')).toBe(true);
  });

  it('findByRecordId returns empty array when record has no tags', () => {
    const id = insertRecord();
    const tags = tagRepo.findByRecordId(id);
    expect(tags).toEqual([]);
  });

  it('setTagsForRecord attaches tags to a record', () => {
    const id = insertRecord();
    const allTags = tagRepo.findAll();
    const tagIds = [allTags[0].id, allTags[1].id];

    tagRepo.setTagsForRecord(id, tagIds);

    const attached = tagRepo.findByRecordId(id);
    expect(attached).toHaveLength(2);
    expect(attached.map((t) => t.id).sort()).toEqual(tagIds.sort());
  });

  it('setTagsForRecord replaces existing tags', () => {
    const id = insertRecord();
    const allTags = tagRepo.findAll();

    tagRepo.setTagsForRecord(id, [allTags[0].id, allTags[1].id]);
    tagRepo.setTagsForRecord(id, [allTags[2].id]);

    const attached = tagRepo.findByRecordId(id);
    expect(attached).toHaveLength(1);
    expect(attached[0].id).toBe(allTags[2].id);
  });

  it('setTagsForRecord with empty array removes all tags', () => {
    const id = insertRecord();
    const allTags = tagRepo.findAll();

    tagRepo.setTagsForRecord(id, [allTags[0].id]);
    tagRepo.setTagsForRecord(id, []);

    const attached = tagRepo.findByRecordId(id);
    expect(attached).toEqual([]);
  });
});
