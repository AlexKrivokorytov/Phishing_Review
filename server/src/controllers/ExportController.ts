import type { Request, Response, NextFunction } from 'express';
import type { ExportService } from '../services/ExportService';
import {
  JsonExportStrategy,
  CsvExportStrategy,
  type IExportStrategy,
} from "../services/strategies/export.strategies";
import { config } from '../config';
import { parseRecordFilters } from '../utils/parseFilters';
import { formatExportDate } from '../utils/date';

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

  private sendExport(
    req: Request,
    res: Response,
    strategy: IExportStrategy,
  ): void {
    const filters = parseRecordFilters(req);
    const body = this.exportService.export(filters, strategy);
    const date = formatExportDate();
    res.setHeader("Content-Type", strategy.getContentType());
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${config.export.prefix}${date}.${strategy.getFileExtension()}"`,
    );
    res.status(200).send(body);
  }
}
