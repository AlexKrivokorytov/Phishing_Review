import { describe, it, expect, beforeEach, afterEach, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ImportService } from '../../src/services/ImportService';
import { RecordRepository } from '../../src/repositories/RecordRepository';
import db, { initDB } from '../../src/db';

process.env.NODE_ENV = 'test';

describe('ImportService', () => {
  let recordRepo: RecordRepository;
  let importService: ImportService;
  const tempFiles: string[] = [];

  const createTempFile = (fileName: string, content: string): string => {
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, content);
    tempFiles.push(filePath);
    return filePath;
  };

  beforeEach(() => {
    initDB();
    recordRepo = new RecordRepository(db);
    importService = new ImportService(recordRepo);
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

  test('import valid csv', async () => {
    const csvContent = 
      'url_or_email,source,date_collected\n' +
      'http://example-login.biz/secure,manual,2026-03-15\n' +
      'user@phish-bank.com,csv_import,2026-03-20\n';

    const filePath = createTempFile('test.csv', csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  test('import csv with invalid url', async () => {
    const csvContent = 
      'url_or_email,source,date_collected\n' +
      'invalid-url,manual,2026-03-15\n';
    const filePath = createTempFile('invalid-url-test.csv', csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const record = db.prepare('SELECT * FROM records').get() as { url_or_email: string, notes: string };
    expect(record.url_or_email).toBe('invalid-url');
    expect(record.notes).toBe('Invalid URL or Email');
  });

  test('import csv with duplicate', async () => {
    const csvContent = 
      'url_or_email,source,date_collected\n' +
      'http://example-login.biz/secure,manual,2026-03-15\n' +
      'http://example-login.biz/secure,csv_import,2026-03-20\n';
    const filePath = createTempFile('duplicate-test.csv', csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  test('import csv skips records with missing url_or_email', async () => {
    const csvContent = 
      'url_or_email,source,date_collected\n' +
      'http://example-login.biz/secure,manual,2026-03-15\n' +
      ',,2026-03-20\n';
    const filePath = createTempFile('missing-values-test.csv', csvContent);
    const result = await importService.processCsvFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const record = db.prepare('SELECT * FROM records').get() as { url_or_email: string, notes: string };
    expect(record.url_or_email).toBe('http://example-login.biz/secure');
    expect(record.notes).toBe('');
  });

  test('import valid json', async () => {
    const jsonContent = JSON.stringify([
      { url_or_email: 'http://example-json.biz', source: 'manual', date_collected: '2026-03-15' },
      { url_or_email: 'user@json.com', source: 'json_import', date_collected: '2026-03-20' }
    ]);

    const filePath = createTempFile('test.json', jsonContent);
    const result = await importService.processJsonFile(filePath);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  test('import json with invalid url', async () => {
    const jsonContent = JSON.stringify([
      { url_or_email: 'invalid-url', source: 'manual', date_collected: '2026-03-15' }
    ]);
    const filePath = createTempFile('invalid-url-test.json', jsonContent);
    const result = await importService.processJsonFile(filePath);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    const record = db.prepare('SELECT * FROM records').get() as { url_or_email: string, notes: string };
    expect(record.url_or_email).toBe('invalid-url');
    expect(record.notes).toBe('Invalid URL or Email');
  });

  test('throws error for non-array json', async () => {
    const jsonContent = JSON.stringify({ url_or_email: 'http://example.com' });
    const filePath = createTempFile('non-array.json', jsonContent);
    await expect(importService.processJsonFile(filePath)).rejects.toThrow('JSON file must contain an array of records.');
  });
});
