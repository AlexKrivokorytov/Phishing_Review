import type { Request, Response, NextFunction } from 'express';
import type { ImportService, ImportSummary } from '../services/ImportService';
import { CsvImportStrategy, JsonImportStrategy } from '../services/strategies/import.strategies';
import { HttpError } from '../utils/errors';

// Controller to handle importing files.
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // Receives a CSV or JSON file upload and processes it.
  public async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file as Express.Multer.File;

      if (!file) {
        throw new HttpError(400, 'No file was uploaded.');
      }

      let strategy;
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        strategy = new CsvImportStrategy();
      } else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        strategy = new JsonImportStrategy();
      } else {
        throw new HttpError(400, 'File must be a CSV or JSON.');
      }

      const result = await this.importService.processFile(file.path, strategy);

      res.status(200).json({
        success: true,
        imported: result.imported,
        skippedDuplicates: result.skippedDuplicates,
        skippedInvalid: result.skippedInvalid,
        message: buildImportMessage(result),
      });
    } catch (error) {
      next(error);
    }
  }
}

// Builds a human-readable summary message from an import result.
function buildImportMessage(result: ImportSummary): string {
  const parts: string[] = [`${result.imported} imported`];
  if (result.skippedDuplicates > 0) parts.push(`${result.skippedDuplicates} skipped (duplicates)`);
  if (result.skippedInvalid > 0) parts.push(`${result.skippedInvalid} skipped (invalid format)`);
  return parts.join(', ') + '.';
}