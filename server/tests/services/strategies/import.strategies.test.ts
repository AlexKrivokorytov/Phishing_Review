import { describe, it, expect } from 'vitest';
import { CsvImportStrategy, JsonImportStrategy } from '../../../src/services/strategies/import.strategies';
import fs from 'fs';

describe('Import Strategies', () => {
  describe('CsvImportStrategy', () => {
    it('rejects when file does not exist', async () => {
      const strategy = new CsvImportStrategy();
      await expect(strategy.parse('does-not-exist.csv')).rejects.toThrow();
    });

    it('rejects when csv is malformed', async () => {
      const strategy = new CsvImportStrategy();
      fs.writeFileSync('malformed.csv', 'url_or_email,source\n"unclosed_quote,manual\n');
      await expect(strategy.parse('malformed.csv')).rejects.toThrow();
      if (fs.existsSync('malformed.csv')) fs.unlinkSync('malformed.csv');
    });
  });

  describe('JsonImportStrategy', () => {
    it('removes file on success', async () => {
      const strategy = new JsonImportStrategy();
      fs.writeFileSync('valid.json', '[{"url_or_email":"test@example.com","source":"manual"}]');
      await strategy.parse('valid.json');
      expect(fs.existsSync('valid.json')).toBe(false);
    });
    
    it('removes file on error', async () => {
      const strategy = new JsonImportStrategy();
      fs.writeFileSync('invalid.json', '{"not_an_array": true}');
      await expect(strategy.parse('invalid.json')).rejects.toThrow();
      expect(fs.existsSync('invalid.json')).toBe(false);
    });
  });
});
