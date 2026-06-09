import { Router } from 'express';
import { RecordController } from '../controllers/RecordController';
import { RecordService } from '../services/RecordService';
import { RecordRepository } from '../repositories/RecordRepository';
import { TagRepository } from '../repositories/TagRepository';
import db from '../db';

const recordRepo = new RecordRepository(db);
const tagRepo = new TagRepository(db);
const recordService = new RecordService(recordRepo, tagRepo);
const recordController = new RecordController(recordService);

const router = Router();

router.get('/', (req, res, next) => recordController.getAll(req, res, next));
router.get('/counts', (req, res, next) => recordController.getCounts(req, res, next));
router.get('/:id', (req, res, next) => recordController.getById(req, res, next));
router.patch('/:id', (req, res, next) => recordController.update(req, res, next));

export default router;
