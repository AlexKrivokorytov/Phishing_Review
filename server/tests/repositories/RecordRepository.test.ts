import { describe, it, expect, beforeEach } from 'vitest';
import { RecordRepository } from '../../src/repositories/RecordRepository';
import db, { initDB } from '../../src/db';
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
    initDB();
    repo = new RecordRepository(db);
    db.prepare('DELETE FROM records').run();
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

  it('findAll returns all inserted records', () => {
    repo.insert(makeRecord());
    repo.insert(makeRecord());
    const records = repo.findAll();
    expect(records).toHaveLength(2);
  });

  it('findAll filters by status', () => {
    repo.insert(makeRecord({ status: 'new' }));
    repo.insert(makeRecord({ status: 'reviewed' }));
    const records = repo.findAll({ status: 'new' });
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('new');
  });

  it('findAll searches by url_or_email substring', () => {
    repo.insert(makeRecord({ url_or_email: 'http://phish.com' }));
    repo.insert(makeRecord({ url_or_email: 'http://benign.com' }));
    const records = repo.findAll({ search: 'phish' });
    expect(records).toHaveLength(1);
    expect(records[0].url_or_email).toBe('http://phish.com');
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
    const counts = repo.getCounts();
    expect(counts).toEqual({
      total: 3,
      new: 2,
      reviewed: 1,
      phishing: 1,
    });
  });
});
