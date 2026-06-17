import { stringify } from 'csv-stringify/sync';
import type { RecordWithTags, Tag } from '../../types/record.types';

export interface IExportStrategy {
  serialize(records: RecordWithTags[]): string;
  getContentType(): string;
  getFileExtension(): string;
}

/** Serializes records to a JSON array. Tags are exported under the key `evidence_tags` per TZ spec. */
export class JsonExportStrategy implements IExportStrategy {
  public serialize(records: RecordWithTags[]): string {
    const mapped = records.map(({ tags, ...rest }) => ({ ...rest, evidence_tags: tags.map((t: Tag) => t.name) }));
    return JSON.stringify(mapped, null, 2);
  }
  public getContentType(): string { return 'application/json'; }
  public getFileExtension(): string { return 'json'; }
}

/** Serializes records to CSV. Tags are joined as a semicolon-separated string under `evidence_tags`. */
export class CsvExportStrategy implements IExportStrategy {
  public serialize(records: RecordWithTags[]): string {
    const flattenedRecords = records.map(({ tags, ...rest }) => ({
      ...rest,
      evidence_tags: tags.map((t: Tag) => t.name).join('; '),
    }));

    return stringify(flattenedRecords, {
      header: true,
      columns: [
        'id', 'url_or_email', 'source', 'date_collected', 'imported_at',
        'label', 'status', 'notes', 'evidence_tags', 'reviewed_at'
      ]
    });
  }
  public getContentType(): string { return 'text/csv'; }
  public getFileExtension(): string { return 'csv'; }
}
