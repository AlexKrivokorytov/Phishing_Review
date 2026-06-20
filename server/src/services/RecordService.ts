import type { RecordRepository } from '../repositories/RecordRepository';
import type { TagRepository } from '../repositories/TagRepository';
import type { RecordWithTags, UpdateRecordDto, RecordFilters } from '../types/record.types';

// Service to manage phishing records.
export class RecordService {
  constructor(
    private readonly recordRepo: RecordRepository,
    private readonly tagRepo: TagRepository,
  ) {}

  // Gets all records from the database.
  public getAll(filters: RecordFilters = {}): { data: RecordWithTags[]; total: number } {
    const data = this.recordRepo.findAllWithTags(filters);
    const total = this.recordRepo.countAllWithTags(filters);
    return { data, total };
  }

  // Gets a single record by its ID.
  public getById(id: string): RecordWithTags {
    const hasOptimizedLookup =
      "findByIdWithTags" in this.recordRepo &&
      typeof this.recordRepo.findByIdWithTags === "function";

    const record = hasOptimizedLookup
      ? this.recordRepo.findByIdWithTags(id)
      : (() => {
          const baseRecord = this.recordRepo.findById(id);
          return baseRecord
            ? { ...baseRecord, tags: this.tagRepo.findByRecordId(id) }
            : undefined;
        })();

    if (!record) {
      throw new Error(`Record not found: id=${id}`);
    }

    return record;
  }

  // Updates a record with a review label, status, notes, and tags.
  public review(id: string, dto: UpdateRecordDto): RecordWithTags {
    if (Object.keys(dto).length === 0) {
      throw new Error('Update payload cannot be empty');
    }

    const affected = this.recordRepo.update(id, dto);
    if (affected === 0) throw new Error(`Record not found: id=${id}`);

    if (dto.tagIds !== undefined) {
      this.tagRepo.setTagsForRecord(id, dto.tagIds);
    }

    return this.getById(id);
  }

  // Gets totals and status-based counts of records.
  public getCounts(): { total: number; new: number; reviewed: number; needs_second_review: number; phishing: number } {
    return this.recordRepo.getCounts();
  }
}
