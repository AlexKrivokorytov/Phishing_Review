import type { RecordRepository } from '../repositories/RecordRepository';
import type { TagRepository } from '../repositories/TagRepository';
import type {
  RecordWithTags,
  UpdateRecordDto,
  RecordFilters,
} from '../types/record.types';

/**
 * Service orchestrating operations on phishing-review records.
 */
export class RecordService {
  constructor(
    private readonly recordRepo: RecordRepository,
    private readonly tagRepo: TagRepository,
  ) {}

  /**
   * Fetches records matching filters, enriching them with tags.
   *
   * @param filters - Filtering criteria.
   * @returns Enriched list of records.
   */
  public getAll(filters: RecordFilters = {}): RecordWithTags[] {
    const records = this.recordRepo.findAll(filters);
    return records.map((record) => {
      const tags = this.tagRepo.findByRecordId(record.id);
      return { ...record, tags };
    });
  }

  /**
   * Fetches a record by ID, raising an error if it doesn't exist.
   *
   * @param id - Record UUID.
   * @returns Enriched record.
   * @throws Error when not found.
   */
  public getById(id: string): RecordWithTags {
    const record = this.recordRepo.findById(id);
    if (!record) {
      throw new Error(`Record not found: id=${id}`);
    }
    const tags = this.tagRepo.findByRecordId(id);
    return { ...record, tags };
  }

  /**
   * Reviews and updates record details (labels, state, note, tags).
   *
   * @param id - Record UUID.
   * @param dto - Updated data fields.
   * @returns The updated record.
   * @throws Error on empty payload or missing record.
   */
  public review(id: string, dto: UpdateRecordDto): RecordWithTags {
    if (Object.keys(dto).length === 0) {
      throw new Error('Update payload cannot be empty');
    }

    const affected = this.recordRepo.update(id, dto);
    if (affected === 0) {
      throw new Error(`Record not found: id=${id}`);
    }

    if (dto.tagIds !== undefined) {
      this.tagRepo.setTagsForRecord(id, dto.tagIds);
    }

    return this.getById(id);
  }

  /**
   * Retrieves summary counts for stats dashboard.
   *
   * @returns Count metrics object.
   */
  public getCounts(): { total: number; new: number; reviewed: number; phishing: number } {
    return this.recordRepo.getCounts();
  }
}
