import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportService } from '../../src/services/ExportService';
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
    it('returns a valid JSON string of records', () => {
      const result = exportService.exportJson();
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-id-1');
      expect(mockRecordService.getAll).toHaveBeenCalled();
    });

    it('passes filters to RecordService', () => {
      exportService.exportJson({ status: 'new' });
      expect(mockRecordService.getAll).toHaveBeenCalledWith({ status: 'new' });
    });
  });

  describe('exportCsv', () => {
    it('returns a valid CSV string with headers', () => {
      const result = exportService.exportCsv();
      const lines = result.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      const header = lines[0];
      expect(header).toContain('url_or_email');
      expect(header).toContain('tags');
      expect(header).toContain('label');
    });

    it('flattens tags into a semicolon-separated string', () => {
      const result = exportService.exportCsv();
      const lines = result.trim().split('\n');
      const dataLine = lines[1];
      expect(dataLine).toContain('brand_impersonation; credential_form');
    });

    it('passes filters to RecordService', () => {
      exportService.exportCsv({ search: 'example' });
      expect(mockRecordService.getAll).toHaveBeenCalledWith({ search: 'example' });
    });
  });
});
