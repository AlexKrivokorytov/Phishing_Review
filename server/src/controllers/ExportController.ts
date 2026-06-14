import { Request, Response, NextFunction } from 'express';
import type { ExportService } from '../services/ExportService';
import type { RecordFilters, Status } from '../types/record.types';

export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  public getJson(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters = this.parseFilters(req);
      const jsonStr = this.exportService.exportJson(filters);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="phishguard-export-${this.getDateString()}.json"`);
      res.status(200).send(jsonStr);
    } catch (error) {
      next(error);
    }
  }

  public getCsv(req: Request, res: Response, next: NextFunction): void {
    try {
      const filters = this.parseFilters(req);
      const csvStr = this.exportService.exportCsv(filters);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="phishguard-export-${this.getDateString()}.csv"`);
      res.status(200).send(csvStr);
    } catch (error) {
      next(error);
    }
  }

  private parseFilters(req: Request): RecordFilters {
    const filters: RecordFilters = {};
    if (req.query.status && typeof req.query.status === 'string') {
      filters.status = req.query.status as Status;
    }
    if (req.query.search && typeof req.query.search === 'string') {
      filters.search = req.query.search;
    }
    return filters;
  }

  private getDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
