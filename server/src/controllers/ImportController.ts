import { Request, Response, NextFunction } from "express";
import "multer";
import { ImportService } from "../services/ImportService";

export class ImportController {
    constructor(private importService: ImportService) { }

    public async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const file = req.file as Express.Multer.File;

            if (!file) {
                throw new Error('No file was uploaded.');
            }

            let result;
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                result = await this.importService.processCsvFile(file.path);
            } else if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
                result = await this.importService.processJsonFile(file.path);
            } else {
                throw new Error('File must be a CSV or JSON.');
            }

            res.status(200).json({
                success: true,
                imported: result.imported,
                skipped: result.skipped,
                message: `${result.imported} records imported successfully, ${result.skipped} skipped due to duplicates.`
            });
        } catch (error) {
            next(error);
        }
    }
}