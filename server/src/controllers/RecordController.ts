import type { Request, Response, NextFunction } from 'express';
import type { RecordService } from '../services/RecordService';
import type { UpdateRecordDto, RecordFilters, Status } from '../types/record.types';

/**
 * Controller class managing HTTP request processing for records.
 */
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  /**
   * Handles listing records with optional filters.
   *
   * @param req - Express request.
   * @param res - Express response.
   * @param next - Next middleware trigger.
   */
  public getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const { status, search } = req.query;
      const filters: RecordFilters = {};

      if (status) {
        const validStatuses: Status[] = ['new', 'reviewed', 'needs_second_review'];
        if (!validStatuses.includes(status as Status)) {
          res.status(400).json({ error: `Invalid status: ${status}` });
          return;
        }
        filters.status = status as Status;
      }

      if (typeof search === 'string') {
        filters.search = search;
      }

      const records = this.recordService.getAll(filters);
      res.status(200).json(records);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles querying a record by ID.
   *
   * @param req - Express request.
   * @param res - Express response.
   * @param next - Next middleware trigger.
   */
  public getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid record ID format' });
        return;
      }
      try {
        const record = this.recordService.getById(id);
        res.status(200).json(record);
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message && error.message.includes('Record not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles updating a record details.
   *
   * @param req - Express request.
   * @param res - Express response.
   * @param next - Next middleware trigger.
   */
  public update(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid record ID format' });
        return;
      }

      const dto: UpdateRecordDto = req.body;

      if (dto.status !== undefined) {
        const validStatuses: Status[] = ['new', 'reviewed', 'needs_second_review'];
        if (!validStatuses.includes(dto.status)) {
          res.status(400).json({ error: `Invalid status value: ${dto.status}` });
          return;
        }
      }

      if (dto.label !== undefined && dto.label !== null) {
        const validLabels = ['benign', 'suspicious', 'phishing', 'malware'];
        if (!validLabels.includes(dto.label)) {
          res.status(400).json({ error: `Invalid label value: ${dto.label}` });
          return;
        }
      }

      if (dto.tagIds !== undefined) {
        if (!Array.isArray(dto.tagIds) || dto.tagIds.some((item) => typeof item !== 'number')) {
          res.status(400).json({ error: 'tagIds must be an array of numbers' });
          return;
        }
      }

      try {
        const updated = this.recordService.review(id, dto);
        res.status(200).json(updated);
      } catch (err: unknown) {
        const error = err as Error;
        if (error.message && error.message.includes('Record not found')) {
          res.status(404).json({ error: error.message });
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles retrieving summary statistics.
   *
   * @param req - Express request.
   * @param res - Express response.
   * @param next - Next middleware trigger.
   */
  public getCounts(req: Request, res: Response, next: NextFunction): void {
    try {
      const counts = this.recordService.getCounts();
      res.status(200).json(counts);
    } catch (error) {
      next(error);
    }
  }
}
