import fs from 'fs';
import { parse } from 'csv-parse';
import crypto from 'crypto';
import type { RecordRepository } from '../repositories/RecordRepository';

interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

export class ImportService {
  constructor(private readonly recordRepo: RecordRepository) {}

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
            const stats = this.processRows(parsedRows);
            fs.unlinkSync(filePath);
            resolve(stats);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  public async processJsonFile(
    filePath: string,
  ): Promise<{ imported: number; skipped: number }> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of records.');
      }

      const parsedRows: CsvRow[] = [];
      for (const item of data) {
        if (item && item.url_or_email && item.url_or_email.trim() !== '' && item.source) {
          parsedRows.push({
            url_or_email: item.url_or_email,
            source: item.source,
            date_collected: item.date_collected || new Date().toISOString()
          });
        }
      }

      const stats = this.processRows(parsedRows);
      fs.unlinkSync(filePath);
      return stats;
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
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

      if (changes > 0) {
        importedCount++;
      } else {
        skippedCount++;
      }
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
