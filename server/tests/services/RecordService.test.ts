import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecordService } from '../../src/services/RecordService';
import type { RecordRepository } from '../../src/repositories/RecordRepository';
import type { TagRepository } from '../../src/repositories/TagRepository';
import type { RecordWithTags } from '../../src/types/record.types';

const makeFakeRecord = (override: Partial<RecordWithTags> = {}): RecordWithTags => ({
  id: 'fake-id-001',
  url_or_email: 'http://phish.example.com',
  source: 'manual',
  date_collected: '2026-01-01',
  imported_at: '2026-01-01T00:00:00.000Z',
  label: null,
  status: 'new',
  notes: '',
  reviewed_at: null,
  tags: [],
  ...override,
});

describe('RecordService', () => {
  let mockRecordRepo: Partial<RecordRepository>;
  let mockTagRepo: Partial<TagRepository>;
  let service: RecordService;

  beforeEach(() => {
    mockRecordRepo = {
      findAllWithTags: vi.fn().mockReturnValue([makeFakeRecord()]),
      countAllWithTags: vi.fn().mockReturnValue(1),
      findById: vi.fn().mockReturnValue(makeFakeRecord()),
      update: vi.fn().mockReturnValue(1),
      getCounts: vi.fn().mockReturnValue({ total: 1, new: 1, reviewed: 0, needs_second_review: 0, phishing: 0 }),
    };
    mockTagRepo = {
      findByRecordId: vi.fn().mockReturnValue([]),
      setTagsForRecord: vi.fn(),
    };
    service = new RecordService(
      mockRecordRepo as RecordRepository,
      mockTagRepo as TagRepository,
    );
  });

  describe('getAll()', () => {
    it('returns records with tags attached', () => {
      const result = service.getAll();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].tags).toBeDefined();
      expect(Array.isArray(result.data[0].tags)).toBe(true);
      expect(result.total).toBe(1);
      expect(mockRecordRepo.findAllWithTags).toHaveBeenCalledTimes(1);
      expect(mockRecordRepo.countAllWithTags).toHaveBeenCalledTimes(1);
    });

    it('passes filters to the repository', () => {
      const filters = { status: 'new' as const, search: 'phish' };
      service.getAll(filters);
      expect(mockRecordRepo.findAllWithTags).toHaveBeenCalledWith(filters);
      expect(mockRecordRepo.countAllWithTags).toHaveBeenCalledWith(filters);
    });
  });

  describe('getById()', () => {
    it('returns a record with its tags', () => {
      const record = service.getById('fake-id-001');
      expect(record.id).toBe('fake-id-001');
      expect(record.tags).toEqual([]);
      expect(mockRecordRepo.findById).toHaveBeenCalledWith('fake-id-001');
    });

    it('throws when record is not found', () => {
      mockRecordRepo.findById = vi.fn().mockReturnValue(undefined);
      expect(() => service.getById('bad-id')).toThrow('Record not found: id=bad-id');
    });
  });

  describe('review()', () => {
    it('calls repository update with provided dto', () => {
      const dto = { label: 'phishing' as const, status: 'reviewed' as const };
      const result = service.review('fake-id-001', dto);
      expect(mockRecordRepo.update).toHaveBeenCalledWith('fake-id-001', dto);
      expect(result.id).toBe('fake-id-001');
    });

    it('calls setTagsForRecord when tagIds are provided', () => {
      const dto = { tagIds: [1, 2] };
      service.review('fake-id-001', dto);
      expect(mockTagRepo.setTagsForRecord).toHaveBeenCalledWith('fake-id-001', [1, 2]);
    });

    it('throws when dto is empty', () => {
      expect(() => service.review('fake-id-001', {})).toThrow('Update payload cannot be empty');
    });
  });

  describe('getCounts()', () => {
    it('delegates to recordRepo.getCounts()', () => {
      const counts = service.getCounts();
      expect(counts).toEqual({ total: 1, new: 1, reviewed: 0, needs_second_review: 0, phishing: 0 });
      expect(mockRecordRepo.getCounts).toHaveBeenCalledTimes(1);
    });
  });
});
