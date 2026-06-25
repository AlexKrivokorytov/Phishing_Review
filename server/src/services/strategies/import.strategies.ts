import fs from 'fs';
import { parse } from 'csv-parse';

// Represents a row from parsed CSV/JSON
export interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

// Interface for file import strategies
export interface IImportStrategy {
  // Parses a file and returns parsed rows
  parse(filePath: string): Promise<CsvRow[]>;
}

// Narrows an untyped parsed value to a CsvRow-shaped object.
function isCsvRowLike(value: unknown): value is { url_or_email: string; source: string; date_collected?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).url_or_email === 'string' &&
    typeof (value as Record<string, unknown>).source === 'string'
  );
}

// Import strategy for JSON files. Deletes the file when done.
export class JsonImportStrategy implements IImportStrategy {
  // Reads and parses JSON array
  public async parse(filePath: string): Promise<CsvRow[]> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data: unknown = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of records.');
      }

      const parsedRows: CsvRow[] = [];
      for (const item of data) {
        if (isCsvRowLike(item) && item.url_or_email.trim() !== '') {
          parsedRows.push({
            url_or_email: item.url_or_email,
            source: item.source,
            date_collected: typeof item.date_collected === 'string' && item.date_collected
              ? item.date_collected
              : new Date().toISOString()
          });
        }
      }
      return parsedRows;
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}

// Import strategy for CSV files. Deletes the file when done.
export class CsvImportStrategy implements IImportStrategy {
  // Reads and parses CSV file stream
  public async parse(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const parsedRows: CsvRow[] = [];

      const readStream = fs.createReadStream(filePath);
      
      readStream.on('error', (error) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(error);
      });

      readStream
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: unknown) => {
          if (isCsvRowLike(row) && row.url_or_email.trim() !== '') {
            parsedRows.push({
              url_or_email: row.url_or_email,
              source: row.source,
              date_collected: typeof row.date_collected === 'string' && row.date_collected
                ? row.date_collected
                : new Date().toISOString(),
            });
          }
        })
        .on('end', () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          resolve(parsedRows);
        })
        .on('error', (error) => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(error);
        });
    });
  }
}
