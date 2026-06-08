import fs from 'fs';
import { parse } from 'csv-parse';
import crypto from 'crypto';
import db from '../db';

interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

export class ImportService {
  public async processCsvFile(filePath: string): Promise<{ imported: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      const parsedRows: CsvRow[] = [];
      let importedCount = 0;
      let skippedCount = 0;

      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: CsvRow) => {
          if (row.url_or_email && row.source && row.date_collected) {
            parsedRows.push(row);
          }
        })
        .on('end', () => {
          try {
            const insertMany = db.transaction((rows: CsvRow[]) => {
              const stmt = db.prepare(`
                INSERT INTO records (id, url_or_email, source, date_collected, imported_at, status)
                VALUES (@id, @url_or_email, @source, @date_collected, @imported_at, 'new')
                ON CONFLICT(url_or_email) DO NOTHING
              `);

              for (const row of rows) {
                const info = stmt.run({
                  id: crypto.randomUUID(), 
                  url_or_email: row.url_or_email,
                  source: row.source,
                  date_collected: row.date_collected,
                  imported_at: new Date().toISOString()
                });
                
                if (info.changes > 0) {
                  importedCount++;
                } else {
                  skippedCount++;
                }
              }
            });

            insertMany(parsedRows);

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
}