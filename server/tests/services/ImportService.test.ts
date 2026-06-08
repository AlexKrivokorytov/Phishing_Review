import { describe, it, expect, beforeEach, afterEach, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ImportService } from '../../src/services/ImportService';
import db, { initDB } from '../../src/db';

process.env.NODE_ENV = 'test';

describe('ImportService', () => {
  const importService = new ImportService();
  const tempFiles: string[] = [];

  const createTempCsv = (fileName: string, content: string): string => {
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, content);
    tempFiles.push(filePath);
    return filePath;
  };

  beforeEach(() => {
    initDB();
  });

  afterEach(() => {
    db.prepare('DELETE FROM records').run();
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    tempFiles.length = 0; 
  });
  test("import valid csv", async () => {
    const csvContent = 
    "url_or_email,source,date_collected\n" +
    "http://example-login.biz/secure,manual,2026-03-15\n" +
    "user@phish-bank.com,csv_import,2026-03-20\n";

    const filePath = createTempCsv("test.csv", csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  test("import csv with invalid url", async () => {
    const csvContent = 
    "url_or_email,source,date_collected\n" +
    "invalid-url,manual,2026-03-15\n";
    const filePath = createTempCsv("invalid-url-test.csv", csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const record = db.prepare('SELECT * FROM records').get() as { url_or_email: string, notes: string };
    expect(record.url_or_email).toBe("invalid-url");
    expect(record.notes).toBe("Invalid URL or Email");
  });

  test("import csv with duplicate", async () => {
    const csvContent = 
    "url_or_email,source,date_collected\n" +
    "http://example-login.biz/secure,manual,2026-03-15\n" +
    "http://example-login.biz/secure,csv_import,2026-03-20\n";
    const filePath = createTempCsv("duplicate-test.csv", csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  test("import csv skips records with missing url_or_email", async () => {
    const csvContent = 
    "url_or_email,source,date_collected\n" +
    "http://example-login.biz/secure,manual,2026-03-15\n" +
    ",,2026-03-20\n";
    const filePath = createTempCsv("missing-values-test.csv", csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const record = db.prepare('SELECT * FROM records').get() as { url_or_email: string, notes: string };
    expect(record.url_or_email).toBe("http://example-login.biz/secure");
    expect(record.notes).toBeNull();
  });
});
