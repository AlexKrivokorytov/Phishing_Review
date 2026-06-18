import { describe, it, expect, beforeEach } from 'vitest';
import { RecordRepository } from '../../src/repositories/RecordRepository';
import { TagRepository } from '../../src/repositories/TagRepository';
import { DatabaseFactory } from '../../src/db';
import type { Record } from '../../src/types/record.types';
import { randomUUID } from 'crypto';

process.env.NODE_ENV = 'test';

const makeRecord = (override: Partial<Record> = {}): Record => ({
  id: randomUUID(),
  url_or_email: `http://example-${randomUUID()}.com`,
  source: 'manual',
  date_collected: '2026-01-01',
  imported_at: new Date().toISOString(),
  label: null,
  status: 'new',
  notes: '',
  reviewed_at: null,
  ...override,
});

describe('RecordRepository', () => {
  let repo: RecordRepository;

  beforeEach(() => {
    DatabaseFactory.resetConnection();
    const db = DatabaseFactory.getConnection();
    repo = new RecordRepository(db);
  });

  it('inserts a record and returns 1 change', () => {
    const changes = repo.insert(makeRecord());
    expect(changes).toBe(1);
  });

  it('skips duplicate url_or_email and returns 0 changes', () => {
    const record = makeRecord({ url_or_email: 'http://duplicate.com' });
    const c1 = repo.insert(record);
    const c2 = repo.insert(makeRecord({ url_or_email: 'http://duplicate.com' }));
    expect(c1).toBe(1);
    expect(c2).toBe(0);
  });

  it('findAllWithTags returns all inserted records', () => {
    repo.insert(makeRecord());
    repo.insert(makeRecord());
    const records = repo.findAllWithTags();
    expect(records).toHaveLength(2);
  });

  it('findAllWithTags filters by status', () => {
    repo.insert(makeRecord({ status: 'new' }));
    repo.insert(makeRecord({ status: 'reviewed' }));
    const records = repo.findAllWithTags({ status: 'new' });
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('new');
  });

  it('findAllWithTags searches by url_or_email', () => {
    repo.insert(makeRecord({ url_or_email: 'http://phish.example.com' }));
    repo.insert(makeRecord({ url_or_email: 'http://benign.example.com' }));
    const results = repo.findAllWithTags({ search: 'phish' });
    expect(results).toHaveLength(1);
    expect(results[0].url_or_email).toBe('http://phish.example.com');
  });

  it('countAllWithTags returns correct count with and without filters', () => {
    const r1 = makeRecord({ id: 'test-uuid-1', url_or_email: 'test1@example.com', label: 'phishing' });
    const r2 = makeRecord({ id: 'test-uuid-2', url_or_email: 'test2@example.com', label: 'benign' });
    repo.insert(r1);
    repo.insert(r2);
    
    expect(repo.countAllWithTags()).toBe(2);
    expect(repo.countAllWithTags({ label: 'phishing' })).toBe(1);
    expect(repo.countAllWithTags({ search: 'test2@example.com' })).toBe(1);
  });

  it('findAllWithTags parses tags that contain colons', () => {
    const record = makeRecord({ id: 'test-uuid-1' });
    repo.insert(record);
    const db = (repo as any).db;
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run('tag:with:colon');
    const tagRepo = new TagRepository(db);
    tagRepo.setTagsForRecord('test-uuid-1', [Number(result.lastInsertRowid)]);
    
    const records = repo.findAllWithTags();
    expect(records).toHaveLength(1);
    expect(records[0].tags[0].name).toBe('tag:with:colon');
  });

  it('findAllWithTags paginates using limit and page', () => {
    repo.insert(makeRecord({ url_or_email: 'http://1.com' }));
    repo.insert(makeRecord({ url_or_email: 'http://2.com' }));
    repo.insert(makeRecord({ url_or_email: 'http://3.com' }));
    
    // Page 2, Limit 1
    const results = repo.findAllWithTags({ limit: 1, page: 2 });
    expect(results).toHaveLength(1);
  });

  it('findAllWithTags returns empty tags when none exist', () => {
    repo.insert(makeRecord({ url_or_email: 'http://notags.com' }));
    const results = repo.findAllWithTags();
    expect(results[0].tags).toEqual([]);
  });


  it('findById returns the correct record', () => {
    const record = makeRecord();
    repo.insert(record);
    const found = repo.findById(record.id);
    expect(found).toBeDefined();
    expect(found?.url_or_email).toBe(record.url_or_email);
  });

  it('findById returns undefined for unknown id', () => {
    const found = repo.findById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('update changes label and status', () => {
    const record = makeRecord({ status: 'new', label: null });
    repo.insert(record);

    const changes = repo.update(record.id, { label: 'phishing', status: 'reviewed' });
    expect(changes).toBe(1);

    const updated = repo.findById(record.id);
    expect(updated?.status).toBe('reviewed');
    expect(updated?.label).toBe('phishing');
    expect(updated?.reviewed_at).not.toBeNull();
  });

  it('getCounts returns correct totals', () => {
    repo.insert(makeRecord({ status: 'new', label: null }));
    repo.insert(makeRecord({ status: 'new', label: 'phishing' }));
    repo.insert(makeRecord({ status: 'reviewed', label: null }));
    repo.insert(makeRecord({ status: 'needs_second_review', label: null }));
    const counts = repo.getCounts();
    expect(counts).toEqual({
      total: 4,
      new: 2,
      reviewed: 1,
      needs_second_review: 1,
      phishing: 1,
    });
  });

  it('findAllWithTags filters by label', () => {
    repo.insert(makeRecord({ label: 'phishing' }));
    repo.insert(makeRecord({ label: 'benign' }));
    repo.insert(makeRecord({ label: null }));
    const results = repo.findAllWithTags({ label: 'phishing' });
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('phishing');
  });

  it('update sets reviewed_at to null when status changes back to new', () => {
    const record = makeRecord({ status: 'new' });
    repo.insert(record);
    repo.update(record.id, { status: 'reviewed' });
    repo.update(record.id, { status: 'new' });
    const updated = repo.findById(record.id);
    expect(updated?.reviewed_at).toBeNull();
  });

  it('update returns 0 for a non-existent id', () => {
    const changes = repo.update('does-not-exist', { status: 'reviewed' });
    expect(changes).toBe(0);
  });

  it('update returns 0 if no fields are updated', () => {
    const record = makeRecord();
    repo.insert(record);
    const changes = repo.update(record.id, {});
    expect(changes).toBe(0);
  });
});
