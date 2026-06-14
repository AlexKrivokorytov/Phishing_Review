import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/ImportController';
import { ImportService } from '../services/ImportService';
import { RecordRepository } from '../repositories/RecordRepository';
import db from '../db';

const upload = multer({ dest: 'uploads/' });

const recordRepo = new RecordRepository(db);
const importService = new ImportService(recordRepo);
const importController = new ImportController(importService);

const router = Router();

router.post('/file', upload.single('file'), (req, res, next) =>
  importController.uploadFile(req, res, next),
);

export default router;