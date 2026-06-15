import type { RecordRepository } from '../repositories/RecordRepository';
import type { TagRepository } from '../repositories/TagRepository';
import type { RecordWithTags, UpdateRecordDto, RecordFilters } from '../types/record.types';

export class RecordService {
  constructor(
    private readonly recordRepo: RecordRepository,
    private readonly tagRepo: TagRepository,
  ) {}

  public getAll(filters: RecordFilters = {}): RecordWithTags[] {
    return this.recordRepo.findAllWithTags(filters);
  }

  public getById(id: string): RecordWithTags {
    const record = this.recordRepo.findById(id);
    if (!record) throw new Error(`Record not found: id=${id}`);
    const tags = this.tagRepo.findByRecordId(id);
    return { ...record, tags };
  }

  /** Applies label/status/notes/tags update and returns the refreshed record. */
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

  public getCounts(): { total: number; new: number; reviewed: number; phishing: number } {
    return this.recordRepo.getCounts();
  }
}
