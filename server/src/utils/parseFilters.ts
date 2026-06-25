import type { Request } from 'express';
import type { RecordFilters, Status, Label } from '../types/record.types';
import { VALID_LABELS, VALID_STATUSES } from '../config/constants';
import { HttpError } from './errors';

// Parses and validates the filter query params shared by GET /api/records and
// GET /api/export. Throws HttpError(400) on any invalid value so callers can
// route the error through their standard `next(error)` flow.
export function parseRecordFilters(
  req: Request,
  options: { withPagination?: boolean } = {},
): RecordFilters {
  const filters: RecordFilters = {};
  const { status, label, search, page, limit } = req.query;

  if (typeof status === 'string' && status) {
    if (!VALID_STATUSES.includes(status as Status)) {
      throw new HttpError(400, `Invalid status: ${status}`);
    }
    filters.status = status as Status;
  }

  if (typeof label === 'string' && label) {
    if (!VALID_LABELS.includes(label as Label)) {
      throw new HttpError(400, `Invalid label: ${label}`);
    }
    filters.label = label as Label;
  }

  if (typeof search === 'string') {
    filters.search = search;
  }

  if (options.withPagination) {
    if (typeof page === 'string') {
      const parsed = parseInt(page, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new HttpError(400, 'Invalid page: must be a positive integer');
      }
      filters.page = parsed;
    }

    if (typeof limit === 'string') {
      const parsed = parseInt(limit, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new HttpError(400, 'Invalid limit: must be a positive integer');
      }
      filters.limit = parsed;
    }
  }

  return filters;
}
