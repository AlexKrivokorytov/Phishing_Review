import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportService } from '../../src/services/ExportService';
import { JsonExportStrategy, CsvExportStrategy } from '../../src/services/strategies/export.strategies';
import type { RecordService } from '../../src/services/RecordService';
import type { RecordWithTags } from '../../src/types/record.types';

const mockRecord: RecordWithTags = {
  id: 'test-id-1',
  url_or_email: 'http://example.com',
  source: 'manual',
  date_collected: '2026-01-01',
  imported_at: '2026-01-01T00:00:00Z',
  label: 'phishing',
  status: 'reviewed',
  notes: 'test note',
  reviewed_at: '2026-01-02T00:00:00Z',
  tags: [
    { id: 1, name: 'brand_impersonation' },
    { id: 2, name: 'credential_form' }
  ]
};

describe('ExportService', () => {
  let mockRecordService: Partial<RecordService>;
  let exportService: ExportService;

  beforeEach(() => {
    mockRecordService = {
      getAll: vi.fn().mockReturnValue([mockRecord])
    };
    exportService = new ExportService(mockRecordService as RecordService);
  });

  describe('exportJson', () => {
    it('export(JsonExportStrategy) returns valid JSON array', () => {
      const jsonStr = exportService.export({}, new JsonExportStrategy());
      const parsed = JSON.parse(jsonStr);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-id-1');
      expect(mockRecordService.getAll).toHaveBeenCalled();
    });

    it('passes filters to RecordService', () => {
      exportService.export({ status: 'new' }, new JsonExportStrategy());
      expect(mockRecordService.getAll).toHaveBeenCalledWith({ status: 'new' });
    });
  });

  describe('exportCsv', () => {
    it('export(CsvExportStrategy) returns valid CSV string with headers', () => {
      const csvStr = exportService.export({}, new CsvExportStrategy());
      const lines = csvStr.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      const header = lines[0];
      expect(header).toContain('url_or_email');
      expect(header).toContain('tags');
      expect(header).toContain('label');
    });

    it('export(CsvExportStrategy) formats tags correctly', () => {
      const csvStr = exportService.export({}, new CsvExportStrategy());
      const dataLine = csvStr.trim().split('\n')[1];
      expect(dataLine).toContain('brand_impersonation; credential_form');
    });

    it('passes filters to RecordService', () => {
      exportService.export({ search: 'example' }, new CsvExportStrategy());
      expect(mockRecordService.getAll).toHaveBeenCalledWith({ search: 'example' });
    });
  });
});
