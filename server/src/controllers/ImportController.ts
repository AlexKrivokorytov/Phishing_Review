import type { Request, Response, NextFunction } from 'express';
import type { ImportService } from '../services/ImportService';
import { CsvImportStrategy, JsonImportStrategy } from '../services/strategies/import.strategies';

// Controller to handle importing files.
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  // Receives a CSV or JSON file upload and processes it.
  public async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file as Express.Multer.File;

      if (!file) {
        throw new Error('No file was uploaded.');
      }

      let strategy;
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        strategy = new CsvImportStrategy();
      } else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        strategy = new JsonImportStrategy();
      } else {
        throw new Error('File must be a CSV or JSON.');
      }

      const result = await this.importService.processFile(file.path, strategy);

      res.status(200).json({
        success: true,
        imported: result.imported,
        skipped: result.skipped,
        message: `${result.imported} records imported successfully, ${result.skipped} skipped due to duplicates.`,
      });
    } catch (error) {
      next(error);
    }
  }
}