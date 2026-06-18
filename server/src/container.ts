// DI container: creates all shared instances once so every route
// uses the same repository and service objects.
import { RecordRepository } from './repositories/RecordRepository';
import { TagRepository } from './repositories/TagRepository';
import { RecordService } from './services/RecordService';
import { ExportService } from './services/ExportService';
import { ImportService } from './services/ImportService';
import { RecordController } from './controllers/RecordController';
import { ExportController } from './controllers/ExportController';
import { ImportController } from './controllers/ImportController';
import { TagController } from './controllers/TagController';
import { ConfigController } from './controllers/ConfigController';
import { DatabaseFactory } from './db';

const db = DatabaseFactory.getConnection();
const recordRepo = new RecordRepository(db);
const tagRepo = new TagRepository(db);

const recordService = new RecordService(recordRepo, tagRepo);
const exportService = new ExportService(recordService);
const importService = new ImportService(recordRepo);

export const recordController = new RecordController(recordService);
export const exportController = new ExportController(exportService);
export const importController = new ImportController(importService);
export const tagController = new TagController(tagRepo);
export const configController = new ConfigController();
