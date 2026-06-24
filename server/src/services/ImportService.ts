import crypto from 'crypto';
import type { RecordRepository } from '../repositories/RecordRepository';
import type { IImportStrategy, CsvRow } from './strategies/import.strategies';

/** Result of a file import operation. */
export interface ImportSummary {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
}

// Service to handle parsing and importing CSV or JSON files.
export class ImportService {
  constructor(private readonly recordRepo: RecordRepository) {}

  // Processes a file upload, validates its contents, and inserts rows into the database.
  public async processFile(filePath: string, strategy: IImportStrategy): Promise<ImportSummary> {
    const rows = await strategy.parse(filePath);
    return this.processRows(rows);
  }

  // Separates valid from invalid rows, then batch inserts valid ones.
  private processRows(rows: CsvRow[]): ImportSummary {
    const now = new Date().toISOString();

    const validRows: CsvRow[] = [];
    let skippedInvalid = 0;

    for (const row of rows) {
      if (this.isValidUrlOrEmail(row.url_or_email)) {
        validRows.push(row);
      } else {
        skippedInvalid++;
      }
    }

    const recordsToInsert = validRows.map((row) => ({
      id: crypto.randomUUID(),
      url_or_email: row.url_or_email,
      source: row.source,
      date_collected: row.date_collected,
      imported_at: now,
      label: null,
      status: 'new' as const,
      notes: '',
      reviewed_at: null,
    }));

    const imported = this.recordRepo.insertMany(recordsToInsert);
    const skippedDuplicates = recordsToInsert.length - imported;

    return { imported, skippedDuplicates, skippedInvalid };
  }

  // Validates if input is a valid URL or email address.
  private isValidUrlOrEmail(input: string): boolean {
    try {
      new URL(input);
      return true;
    } catch {
      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      return emailPattern.test(input);
    }
  }
}

