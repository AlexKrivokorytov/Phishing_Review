import { Request, Response, NextFunction } from "express";
import "multer";
import { ImportService } from "../services/ImportService";

export class ImportController {
    constructor(private importService: ImportService) { }

    public async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const file = this.getValidatedFile(req);
            const result = await this.importService.processCsvFile(file.path);
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

    private getValidatedFile(req: Request): Express.Multer.File {
        const file = req.file as Express.Multer.File;

        if (!file) {
            throw new Error('No file was uploaded.');
        }

        if (file.mimetype !== 'text/csv') {
            throw new Error('File must be a CSV.');
        }

        return file;
    }
}