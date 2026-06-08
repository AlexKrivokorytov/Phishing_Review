import fs from 'fs';
import { parse } from 'csv-parse';
import crypto from 'crypto';
import db from '../db';

// Define the expected structure of a valid CSV row
interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

export class ImportService {
  /**
   * Parses a CSV file and inserts valid records into the database.
   * Duplicate records are ignored based on the UNIQUE constraint of 'url_or_email'.
   * * @param filePath - The absolute path to the uploaded CSV file
   * @returns An object containing the count of imported and skipped records
   */
  public async processCsvFile(filePath: string): Promise<{ imported: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      const parsedRows: CsvRow[] = [];
      let importedCount = 0;
      let skippedCount = 0;

      // Create a read stream to handle large files efficiently without crashing memory
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: CsvRow) => {
          // Basic validation: ensure all required fields are present
          if (row.url_or_email && row.source && row.date_collected) {
            parsedRows.push(row);
          }
        })
        .on('end', () => {
          try {
            // Use a transaction for bulk inserts to maximize performance
            // and ensure data integrity (all or nothing)
            const insertMany = db.transaction((rows: CsvRow[]) => {
              // ON CONFLICT DO NOTHING elegantly handles our FR-1.4 duplicate requirement
              const stmt = db.prepare(`
                INSERT INTO records (id, url_or_email, source, date_collected, imported_at, status)
                VALUES (@id, @url_or_email, @source, @date_collected, @imported_at, 'new')
                ON CONFLICT(url_or_email) DO NOTHING
              `);

              for (const row of rows) {
                const info = stmt.run({
                  id: crypto.randomUUID(), // Generate a unique UUID v4 for the primary key
                  url_or_email: row.url_or_email,
                  source: row.source,
                  date_collected: row.date_collected,
                  imported_at: new Date().toISOString()
                });
                
                // If changes > 0, the row was inserted. Otherwise, it was a duplicate.
                if (info.changes > 0) {
                  importedCount++;
                } else {
                  skippedCount++;
                }
              }
            });

            // Execute the transaction
            insertMany(parsedRows);

            // Clean up: delete the temporary file after processing
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