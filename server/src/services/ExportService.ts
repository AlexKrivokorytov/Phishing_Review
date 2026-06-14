import { stringify } from 'csv-stringify/sync';
import type { RecordService } from './RecordService';
import type { RecordFilters } from '../types/record.types';

export class ExportService {
  constructor(private readonly recordService: RecordService) {}

  public exportJson(filters: RecordFilters = {}): string {
    const records = this.recordService.getAll(filters);
    return JSON.stringify(records, null, 2);
  }

  public exportCsv(filters: RecordFilters = {}): string {
    const records = this.recordService.getAll(filters);
    
    // Flatten tags into a single comma-separated string for CSV
    const flattenedRecords = records.map(record => ({
      ...record,
      tags: record.tags.map(t => t.name).join('; '),
    }));

    return stringify(flattenedRecords, {
      header: true,
      columns: [
        'id',
        'url_or_email',
        'source',
        'date_collected',
        'imported_at',
        'label',
        'status',
        'notes',
        'tags',
        'reviewed_at'
      ]
    });
  }
}
