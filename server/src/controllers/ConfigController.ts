import type { Request, Response, NextFunction } from 'express';
import { STATUS_OPTIONS, LABEL_OPTIONS } from "../config/constants";
import { config } from "../config";

export class ConfigController {
  public getConfig(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json({
        statusOptions: STATUS_OPTIONS,
        labelOptions: LABEL_OPTIONS,
        defaultPagination: { page: config.pagination.defaultPage, limit: config.pagination.defaultLimit },
        appName: process.env.VITE_APP_NAME || 'PhishGuard',
      });
    } catch (error) {
      next(error);
    }
  }
}
