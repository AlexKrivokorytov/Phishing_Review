import { describe, it, expect, vi } from 'vitest';
import { ConfigController } from '../../src/controllers/ConfigController';
import type { Request, Response, NextFunction } from 'express';
import { STATUS_OPTIONS, LABEL_OPTIONS } from '../../src/config/constants';

describe('ConfigController', () => {
  it('getConfig returns the correct configuration', () => {
    const controller = new ConfigController();
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const originalAppName = process.env.VITE_APP_NAME;
    process.env.VITE_APP_NAME = 'TestApp';

    controller.getConfig(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      statusOptions: STATUS_OPTIONS,
      labelOptions: LABEL_OPTIONS,
      defaultPagination: { page: 1, limit: 10 },
      appName: 'TestApp',
    });

    process.env.VITE_APP_NAME = originalAppName;
  });

  it('getConfig falls back to PhishGuard if VITE_APP_NAME is unset', () => {
    const controller = new ConfigController();
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const originalAppName = process.env.VITE_APP_NAME;
    delete process.env.VITE_APP_NAME;

    controller.getConfig(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      appName: 'PhishGuard',
    }));

    process.env.VITE_APP_NAME = originalAppName;
  });

  it('getConfig calls next on error', () => {
    const controller = new ConfigController();
    const req = {} as Request;
    const res = {
      status: vi.fn().mockImplementation(() => { throw new Error('Test error'); }),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    controller.getConfig(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
