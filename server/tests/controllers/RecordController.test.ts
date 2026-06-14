import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { RecordController } from '../../src/controllers/RecordController';
import type { RecordService } from '../../src/services/RecordService';
import type { RecordWithTags } from '../../src/types/record.types';

const makeRecord = (override: Partial<RecordWithTags> = {}): RecordWithTags => ({
  id: 'test-id-001',
  url_or_email: 'http://phish.example.com',
  source: 'manual',
  date_collected: '2026-01-01',
  imported_at: '2026-01-01T00:00:00.000Z',
  label: null,
  status: 'new',
  notes: '',
  reviewed_at: null,
  tags: [],
  ...override,
});

const buildApp = (controller: RecordController) => {
  const app = express();
  app.use(express.json());
  app.get('/api/records/counts', (req, res, next) => controller.getCounts(req, res, next));
  app.get('/api/records/:id', (req, res, next) => controller.getById(req, res, next));
  app.get('/api/records', (req, res, next) => controller.getAll(req, res, next));
  app.patch('/api/records/:id', (req, res, next) => controller.update(req, res, next));
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });
  return app;
};

describe('RecordController', () => {
  let mockService: Partial<RecordService>;
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    mockService = {
      getAll: vi.fn().mockReturnValue([makeRecord()]),
      getById: vi.fn().mockReturnValue(makeRecord()),
      review: vi.fn().mockReturnValue(makeRecord({ label: 'phishing', status: 'reviewed' })),
      getCounts: vi.fn().mockReturnValue({ total: 1, new: 1, reviewed: 0, phishing: 0 }),
    };
    app = buildApp(new RecordController(mockService as RecordService));
  });

  describe('GET /api/records', () => {
    it('returns 200 with records array', async () => {
      const res = await request(app).get('/api/records');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe('test-id-001');
    });

    it('passes status filter to service', async () => {
      await request(app).get('/api/records?status=reviewed');
      expect(mockService.getAll).toHaveBeenCalledWith({ status: 'reviewed' });
    });

    it('passes search filter to service', async () => {
      await request(app).get('/api/records?search=phish');
      expect(mockService.getAll).toHaveBeenCalledWith({ search: 'phish' });
    });

    it('returns 400 for invalid status value', async () => {
      const res = await request(app).get('/api/records?status=unknown');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });
  });

  describe('GET /api/records/counts', () => {
    it('returns 200 with counts object', async () => {
      const res = await request(app).get('/api/records/counts');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 1, new: 1, reviewed: 0, phishing: 0 });
    });
  });

  describe('GET /api/records/:id', () => {
    it('returns 200 with the record', async () => {
      const res = await request(app).get('/api/records/test-id-001');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test-id-001');
    });

    it('returns 404 when service throws not found', async () => {
      mockService.getById = vi.fn().mockImplementation(() => {
        throw new Error('Record not found: id=bad-id');
      });
      const res = await request(app).get('/api/records/bad-id');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/records/:id', () => {
    it('returns 200 with updated record', async () => {
      const res = await request(app)
        .patch('/api/records/test-id-001')
        .send({ label: 'phishing', status: 'reviewed' });
      expect(res.status).toBe(200);
      expect(res.body.label).toBe('phishing');
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .patch('/api/records/test-id-001')
        .send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });

    it('returns 400 for invalid label', async () => {
      const res = await request(app)
        .patch('/api/records/test-id-001')
        .send({ label: 'trojan' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid label/);
    });

    it('returns 400 when tagIds is not an array of numbers', async () => {
      const res = await request(app)
        .patch('/api/records/test-id-001')
        .send({ tagIds: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/tagIds/);
    });

    it('returns 404 when service throws not found', async () => {
      mockService.review = vi.fn().mockImplementation(() => {
        throw new Error('Record not found: id=bad-id');
      });
      const res = await request(app)
        .patch('/api/records/bad-id')
        .send({ status: 'reviewed' });
      expect(res.status).toBe(404);
    });
  });
});
