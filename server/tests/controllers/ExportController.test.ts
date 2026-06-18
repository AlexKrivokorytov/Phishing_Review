import { describe, it, expect, vi } from 'vitest';
import { ExportController } from '../../src/controllers/ExportController';
import { ExportService } from '../../src/services/ExportService';
import type { Request, Response, NextFunction } from 'express';
import { JsonExportStrategy, CsvExportStrategy } from '../../src/services/strategies/export.strategies';
import { config } from '../../src/config';

describe('ExportController', () => {
  const mockExportService = {
    export: vi.fn(),
  } as unknown as ExportService;

  const controller = new ExportController(mockExportService);

  const mockRes = () => {
    const res: any = {};
    res.setHeader = vi.fn();
    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();
    return res as Response;
  };

  it('getJson exports JSON with correctly parsed filters', () => {
    const req = {
      query: { status: 'new', label: 'phishing', search: 'test' }
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockExportService.export).mockReturnValueOnce('[]');

    controller.getJson(req, res, next);

    expect(mockExportService.export).toHaveBeenCalledWith(
      { status: 'new', label: 'phishing', search: 'test' },
      expect.any(JsonExportStrategy)
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining(`attachment; filename="${config.export.prefix}`));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('[]');
  });

  it('getCsv exports CSV with correctly parsed filters', () => {
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockExportService.export).mockReturnValueOnce('id,url');

    controller.getCsv(req, res, next);

    expect(mockExportService.export).toHaveBeenCalledWith({}, expect.any(CsvExportStrategy));
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining(`attachment; filename="${config.export.prefix}`));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('id,url');
  });

  it('getJson calls next on error', () => {
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockExportService.export).mockImplementationOnce(() => { throw new Error('Export error'); });

    controller.getJson(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('getCsv calls next on error', () => {
    const req = { query: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockExportService.export).mockImplementationOnce(() => { throw new Error('Export error'); });

    controller.getCsv(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
