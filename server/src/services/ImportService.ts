import crypto from 'crypto';
import type { RecordRepository } from '../repositories/RecordRepository';
import type { IImportStrategy, CsvRow } from './strategies/import.strategies';

// Service to handle parsing and importing CSV or JSON files.
export class ImportService {
  constructor(private readonly recordRepo: RecordRepository) {}

  // Processes a file upload, validates its contents, and inserts rows into the database.
  public async processFile(filePath: string, strategy: IImportStrategy): Promise<{ imported: number; skipped: number }> {
    const rows = await strategy.parse(filePath);
    return this.processRows(rows);
  }

  // Maps rows into record objects and batch inserts them in one transaction.
  private processRows(rows: CsvRow[]): { imported: number; skipped: number } {
    const now = new Date().toISOString();
    const recordsToInsert = rows.map((row) => {
      const isValid = this.isValidUrlOrEmail(row.url_or_email);
      return {
        id: crypto.randomUUID(),
        url_or_email: row.url_or_email,
        source: row.source,
        date_collected: row.date_collected,
        imported_at: now,
        label: null,
        status: 'new' as const,
        notes: isValid ? '' : 'Invalid URL or Email',
        reviewed_at: null,
      };
    });

    const imported = this.recordRepo.insertMany(recordsToInsert);
    const skipped = recordsToInsert.length - imported;

    return { imported, skipped };
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
