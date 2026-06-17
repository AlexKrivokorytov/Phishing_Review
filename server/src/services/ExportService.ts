import type { RecordService } from './RecordService';
import type { RecordFilters } from '../types/record.types';
import type { IExportStrategy } from './strategies/export.strategies';

// This service helps with exporting records.
export class ExportService {
  constructor(private readonly recordService: RecordService) {}

  // Gets the records based on filters and uses the strategy to format them as a string.
  public export(filters: RecordFilters, strategy: IExportStrategy): string {
    const response = this.recordService.getAll(filters);
    return strategy.serialize(response.data);
  }
}
