import { describe, it, expect, beforeEach } from 'vitest';
import { RecordRepository } from '../../src/repositories/RecordRepository';
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
});
