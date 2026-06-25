import type { Request, Response, NextFunction } from 'express';
import type { RecordService } from '../services/RecordService';
import type { UpdateRecordDto, RecordFilters } from '../types/record.types';
import { VALID_LABELS, VALID_STATUSES } from '../config/constants';
import { RecordNotFoundError } from '../utils/errors';
import { parseRecordFilters } from '../utils/parseFilters';

// Controller to manage review records.
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  // Gets all records from the database. Can filter by status, label or search text.
  public getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters = parseRecordFilters(req, { withPagination: true });
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
      if (error instanceof RecordNotFoundError) {
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
      const body = req.body;
      const validationError = validateUpdateBody(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }
      const dto: UpdateRecordDto = body;

      if (dto.status !== undefined && !VALID_STATUSES.includes(dto.status)) {
        res.status(400).json({ error: `Invalid status value: ${dto.status}` });
        return;
      }

      if (
        dto.label !== undefined &&
        dto.label !== null &&
        !VALID_LABELS.includes(dto.label)
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
      if (error instanceof RecordNotFoundError) {
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

// Validates the raw PATCH body shape before it is treated as UpdateRecordDto.
// Returns an error message string when invalid, or null when acceptable.
function validateUpdateBody(body: unknown): string | null {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }
  const candidate = body as Record<string, unknown>;
  if (candidate.notes !== undefined && typeof candidate.notes !== 'string') {
    return 'notes must be a string';
  }
  return null;
}
