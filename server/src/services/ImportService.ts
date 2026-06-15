import crypto from 'crypto';
import type { RecordRepository } from '../repositories/RecordRepository';
import type { IImportStrategy, CsvRow } from './strategies/import.strategies';

export class ImportService {
  constructor(private readonly recordRepo: RecordRepository) {}

  public async processFile(filePath: string, strategy: IImportStrategy): Promise<{ imported: number; skipped: number }> {
    const rows = await strategy.parse(filePath);
    return this.processRows(rows);
  }

  private processRows(rows: CsvRow[]): { imported: number; skipped: number } {
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const isValid = this.isValidUrlOrEmail(row.url_or_email);
      const changes = this.recordRepo.insert({
        id: crypto.randomUUID(),
        url_or_email: row.url_or_email,
        source: row.source,
        date_collected: row.date_collected,
        imported_at: new Date().toISOString(),
        label: null,
        status: 'new',
        notes: isValid ? '' : 'Invalid URL or Email',
        reviewed_at: null,
      });

      if (changes > 0) importedCount++;
      else skippedCount++;
    }

    return { imported: importedCount, skipped: skippedCount };
  }

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

