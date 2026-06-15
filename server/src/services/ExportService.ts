import type { RecordService } from './RecordService';
import type { RecordFilters } from '../types/record.types';
import type { IExportStrategy } from './strategies/export.strategies';

export class ExportService {
  constructor(private readonly recordService: RecordService) {}

  public export(filters: RecordFilters, strategy: IExportStrategy): string {
    const records = this.recordService.getAll(filters);
    return strategy.serialize(records);
  }
}

