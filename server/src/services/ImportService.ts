import fs from 'fs';
import { parse } from 'csv-parse';
import crypto from 'crypto';
import type { RecordRepository } from '../repositories/RecordRepository';

interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

/**
 * Service managing CSV parsing and file data importing.
 */
export class ImportService {
  constructor(private readonly recordRepo: RecordRepository) {}

  /**
   * Processes a CSV upload file and stores rows into the database.
   *
   * @param filePath - Path to uploaded temp CSV file.
   * @returns Affected stats results.
   */
  public async processCsvFile(
    filePath: string,
  ): Promise<{ imported: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      const parsedRows: CsvRow[] = [];

      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: CsvRow) => {
          if (row.url_or_email && row.url_or_email.trim() !== '' && row.source) {
            parsedRows.push(row);
          }
        })
        .on('end', () => {
          try {
            let importedCount = 0;
            let skippedCount = 0;

            for (const row of parsedRows) {
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

              if (changes > 0) {
                importedCount++;
              } else {
                skippedCount++;
              }
            }

            fs.unlinkSync(filePath);
            resolve({ imported: importedCount, skipped: skippedCount });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private isValidUrlOrEmail(input: string): boolean {
    const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return urlPattern.test(input) || emailPattern.test(input);
  }
}
