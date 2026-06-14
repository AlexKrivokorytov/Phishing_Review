import { Router } from 'express';
import { ExportController } from '../controllers/ExportController';
import { ExportService } from '../services/ExportService';
import { RecordService } from '../services/RecordService';
import { RecordRepository } from '../repositories/RecordRepository';
import { TagRepository } from '../repositories/TagRepository';
import db from '../db';

const router = Router();

const recordRepo = new RecordRepository(db);
const tagRepo = new TagRepository(db);
const recordService = new RecordService(recordRepo, tagRepo);
const exportService = new ExportService(recordService);
const exportController = new ExportController(exportService);

router.get('/json', (req, res, next) => exportController.getJson(req, res, next));
router.get('/csv', (req, res, next) => exportController.getCsv(req, res, next));

export default router;
