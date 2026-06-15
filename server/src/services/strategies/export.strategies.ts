import { stringify } from 'csv-stringify/sync';
import type { RecordWithTags, Tag } from '../../types/record.types';

export interface IExportStrategy {
  serialize(records: RecordWithTags[]): string;
  getContentType(): string;
  getFileExtension(): string;
}

export class JsonExportStrategy implements IExportStrategy {
  public serialize(records: RecordWithTags[]): string {
    return JSON.stringify(records, null, 2);
  }
  public getContentType(): string { return 'application/json'; }
  public getFileExtension(): string { return 'json'; }
}

export class CsvExportStrategy implements IExportStrategy {
  public serialize(records: RecordWithTags[]): string {
    const flattenedRecords = records.map(record => ({
      ...record,
      tags: record.tags.map((t: Tag) => t.name).join('; '),
    }));

    return stringify(flattenedRecords, {
      header: true,
      columns: [
        'id', 'url_or_email', 'source', 'date_collected', 'imported_at',
        'label', 'status', 'notes', 'tags', 'reviewed_at'
      ]
    });
  }
  public getContentType(): string { return 'text/csv'; }
  public getFileExtension(): string { return 'csv'; }
}
