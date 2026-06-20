import type { Request, Response, NextFunction } from 'express';
import type { RecordService } from '../services/RecordService';
import type { UpdateRecordDto, RecordFilters, Status, Label } from '../types/record.types';
import { VALID_LABELS, VALID_STATUSES } from '../config/constants';

// Controller to manage review records.
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  private static isRecordNotFoundError(error: unknown): error is Error {
    return error instanceof Error && error.message.includes("Record not found");
  }

  // Gets all records from the database. Can filter by status, label or search text.
  public getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const { status, label, search, page, limit } = req.query;
      const filters: RecordFilters = {};

      if (typeof status === "string" && status) {
        if (!VALID_STATUSES.includes(status as Status)) {
          res.status(400).json({ error: `Invalid status: ${status}` });
          return;
        }
        filters.status = status as Status;
      }

      if (typeof label === "string" && label) {
        if (!VALID_LABELS.includes(label as Label)) {
          res.status(400).json({ error: `Invalid label: ${label}` });
          return;
        }
        filters.label = label as Label;
      }

      if (typeof search === "string") {
        filters.search = search;
      }

      if (typeof page === "string") {
        filters.page = parseInt(page, 10);
      }

      if (typeof limit === "string") {
        filters.limit = parseInt(limit, 10);
      }

      res.status(200).json(this.recordService.getAll(filters));
    } catch (error) {
      next(error);
    }
  }

  // Gets a single record by its ID.
  public getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = String(req.params.id);
      res.status(200).json(this.recordService.getById(id));
    } catch (error: unknown) {
      if (RecordController.isRecordNotFoundError(error)) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // Updates a record (label, status, notes, tags).
  public update(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = String(req.params.id);
      const dto: UpdateRecordDto = req.body;

      if (dto.status !== undefined && !VALID_STATUSES.includes(dto.status)) {
        res.status(400).json({ error: `Invalid status value: ${dto.status}` });
        return;
      }

      if (
        dto.label !== undefined &&
        dto.label !== null &&
        !VALID_LABELS.includes(dto.label as (typeof VALID_LABELS)[number])
      ) {
        res.status(400).json({ error: `Invalid label value: ${dto.label}` });
        return;
      }

      if (
        dto.tagIds !== undefined &&
        (!Array.isArray(dto.tagIds) ||
          dto.tagIds.some((item) => typeof item !== "number"))
      ) {
        res.status(400).json({ error: "tagIds must be an array of numbers" });
        return;
      }

      res.status(200).json(this.recordService.review(id, dto));
    } catch (error: unknown) {
      if (RecordController.isRecordNotFoundError(error)) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  // Gets counts for the stats bar (Total, New, Reviewed, Needs Review, Phishing).
  public getCounts(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(this.recordService.getCounts());
    } catch (error) {
      next(error);
    }
  }
}
