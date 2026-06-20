import type { Request, Response, NextFunction } from 'express';
import { STATUS_OPTIONS, LABEL_OPTIONS } from "../config/constants";

export class ConfigController {
  public getConfig(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json({
        statusOptions: STATUS_OPTIONS,
        labelOptions: LABEL_OPTIONS,
        defaultPagination: { page: 1, limit: 10 },
        appName: process.env.VITE_APP_NAME || 'PhishGuard',
      });
    } catch (error) {
      next(error);
    }
  }
}
