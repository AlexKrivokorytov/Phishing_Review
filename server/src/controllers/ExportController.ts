import type { Request, Response, NextFunction } from 'express';
import type { ExportService } from '../services/ExportService';
import { JsonExportStrategy, CsvExportStrategy } from '../services/strategies/export.strategies';
import type { RecordFilters, Status, Label } from '../types/record.types';
import { config } from '../config';

// Controller to handle exporting records.
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // Generates and downloads a JSON file export of filtered records.
  public getJson(req: Request, res: Response, next: NextFunction): void {
    try {
      this.sendExport(req, res, new JsonExportStrategy());
    } catch (error) {
      next(error);
    }
  }

  // Generates and downloads a CSV file export of filtered records.
  public getCsv(req: Request, res: Response, next: NextFunction): void {
    try {
      this.sendExport(req, res, new CsvExportStrategy());
    } catch (error) {
      next(error);
    }
  }

  private sendExport(req: Request, res: Response, strategy: InstanceType<typeof JsonExportStrategy | typeof CsvExportStrategy>): void {
    const filters = this.parseFilters(req);
    const body = this.exportService.export(filters, strategy);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', strategy.getContentType());
    res.setHeader('Content-Disposition', `attachment; filename="${config.export.prefix}${date}.${strategy.getFileExtension()}"`);
    res.status(200).send(body);
  }

  private parseFilters(req: Request): RecordFilters {
    const filters: RecordFilters = {};
    if (req.query.status && typeof req.query.status === 'string') {
      filters.status = req.query.status as Status;
    }
    if (req.query.label && typeof req.query.label === 'string') {
      filters.label = req.query.label as Label;
    }
    if (req.query.search && typeof req.query.search === 'string') {
      filters.search = req.query.search;
    }
    return filters;
  }
}
