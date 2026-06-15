import fs from 'fs';
import { parse } from 'csv-parse';

export interface CsvRow {
  url_or_email: string;
  source: string;
  date_collected: string;
}

export interface IImportStrategy {
  parse(filePath: string): Promise<CsvRow[]>;
}

export class JsonImportStrategy implements IImportStrategy {
  public async parse(filePath: string): Promise<CsvRow[]> {
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
      return parsedRows;
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
}

export class CsvImportStrategy implements IImportStrategy {
  public async parse(filePath: string): Promise<CsvRow[]> {
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
