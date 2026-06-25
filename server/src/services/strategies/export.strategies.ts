import { stringify } from 'csv-stringify/sync';
import type { RecordWithTags, Tag } from '../../types/record.types';

const MIME = {
  json: 'application/json',
  csv: 'text/csv',
} as const;

const EXT = {
  json: 'json',
  csv: 'csv',
} as const;

const CSV_EXPORT_COLUMNS = [
  'id', 'url_or_email', 'source', 'date_collected', 'imported_at',
  'label', 'status', 'notes', 'evidence_tags', 'reviewed_at',
] as const;

// Interface for export strategies
export interface IExportStrategy {
  // Converts a list of records into a text string
  serialize(records: RecordWithTags[]): string;

  // Returns the HTTP Content-Type for downloads
  getContentType(): string;

  // Returns the file extension to use (like 'json' or 'csv')
  getFileExtension(): string;
}

// Strategy to export records as a JSON file.
// The output will have an array of tag names under the key 'evidence_tags'.
export class JsonExportStrategy implements IExportStrategy {
  // Serializes records to JSON format.
  public serialize(records: RecordWithTags[]): string {
    const mapped = records.map(({ tags, ...rest }) => ({
      ...rest,
      evidence_tags: tags.map((tag: Tag) => tag.name),
    }));
    return JSON.stringify(mapped, null, 2);
  }

  // Returns JSON MIME type.
  public getContentType(): string { return MIME.json; }

  // Returns JSON file extension.
  public getFileExtension(): string { return EXT.json; }
}

// Strategy to export records as a CSV file.
// The output will list tag names separated by a semicolon under the column 'evidence_tags'.
export class CsvExportStrategy implements IExportStrategy {
  // Serializes records to CSV format.
  public serialize(records: RecordWithTags[]): string {
    const flattenedRecords = records.map(({ tags, ...rest }) => ({
      ...rest,
      evidence_tags: tags.map((tag: Tag) => tag.name).join('; '),
    }));

    return stringify(flattenedRecords, {
      header: true,
      columns: CSV_EXPORT_COLUMNS,
    });
  }

  // Returns CSV MIME type.
  public getContentType(): string { return MIME.csv; }

  // Returns CSV file extension.
  public getFileExtension(): string { return EXT.csv; }
}
