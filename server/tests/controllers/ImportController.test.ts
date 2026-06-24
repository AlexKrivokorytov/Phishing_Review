import { describe, it, expect, vi } from 'vitest';
import { ImportController } from '../../src/controllers/ImportController';
import { ImportService } from '../../src/services/ImportService';
import type { Request, Response, NextFunction } from 'express';

describe('ImportController', () => {
  const mockImportService = {
    processFile: vi.fn(),
  } as unknown as ImportService;

  const controller = new ImportController(mockImportService);

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();
    return res as Response;
  };

  it('uploadFile calls next with error if no file is provided', async () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    await controller.uploadFile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('uploadFile calls processFile and returns 200 on success for CSV', async () => {
    const req = {
      file: { path: '/tmp/test.csv', originalname: 'test.csv', mimetype: 'text/csv' }
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockImportService.processFile).mockResolvedValueOnce({
      imported: 4,
      skippedDuplicates: 1,
      skippedInvalid: 0,
    });

    await controller.uploadFile(req, res, next);

    expect(mockImportService.processFile).toHaveBeenCalledWith('/tmp/test.csv', expect.anything());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      imported: 4,
      skippedDuplicates: 1,
      skippedInvalid: 0,
      message: '4 imported, 1 skipped (duplicates).',
    });
  });

  it('uploadFile calls processFile and returns 200 on success for JSON', async () => {
    const req = {
      file: { path: '/tmp/test.json', originalname: 'test.json', mimetype: 'application/json' }
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockImportService.processFile).mockResolvedValueOnce({
      imported: 2,
      skippedDuplicates: 0,
      skippedInvalid: 0,
    });

    await controller.uploadFile(req, res, next);

    expect(mockImportService.processFile).toHaveBeenCalledWith('/tmp/test.json', expect.anything());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uploadFile throws error for invalid file type', async () => {
    const req = {
      file: { path: '/tmp/test.txt', originalname: 'test.txt', mimetype: 'text/plain' }
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    await controller.uploadFile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('uploadFile calls next on error', async () => {
    const req = {
      file: { path: '/tmp/test.csv', originalname: 'test.csv', mimetype: 'text/csv' }
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockImportService.processFile).mockRejectedValueOnce(new Error('Import failed'));

    await controller.uploadFile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
