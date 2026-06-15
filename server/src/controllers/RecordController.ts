import type { Request, Response, NextFunction } from 'express';
import type { RecordService } from '../services/RecordService';
import type { UpdateRecordDto, RecordFilters, Status } from '../types/record.types';

const VALID_STATUSES: Status[] = ['new', 'reviewed', 'needs_second_review'];
const VALID_LABELS = ['benign', 'suspicious', 'phishing', 'malware'] as const;

export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  public getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const { status, search } = req.query;
      const filters: RecordFilters = {};

      if (typeof status === 'string' && status) {
        if (!VALID_STATUSES.includes(status as Status)) {
          res.status(400).json({ error: `Invalid status: ${status}` });
          return;
        }
        filters.status = status as Status;
      }

      if (typeof search === 'string') {
        filters.search = search;
      }

      res.status(200).json(this.recordService.getAll(filters));
    } catch (error) {
      next(error);
    }
  }

  public getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Record ID must be a single string' });
        return;
      }

      try {
        res.status(200).json(this.recordService.getById(id));
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message?.includes('Record not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  public update(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Record ID must be a single string' });
        return;
      }

      const dto: UpdateRecordDto = req.body;

      if (dto.status !== undefined && !VALID_STATUSES.includes(dto.status)) {
        res.status(400).json({ error: `Invalid status value: ${dto.status}` });
        return;
      }

      if (dto.label !== undefined && dto.label !== null && !VALID_LABELS.includes(dto.label as typeof VALID_LABELS[number])) {
        res.status(400).json({ error: `Invalid label value: ${dto.label}` });
        return;
      }

      if (dto.tagIds !== undefined && (!Array.isArray(dto.tagIds) || dto.tagIds.some((item) => typeof item !== 'number'))) {
        res.status(400).json({ error: 'tagIds must be an array of numbers' });
        return;
      }

      try {
        res.status(200).json(this.recordService.review(id, dto));
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message?.includes('Record not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  public getCounts(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(this.recordService.getCounts());
    } catch (error) {
      next(error);
    }
  }
}
