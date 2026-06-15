import { Router } from 'express';
import { recordController } from '../container';

const router = Router();

router.get('/', (req, res, next) => recordController.getAll(req, res, next));
router.get('/counts', (req, res, next) => recordController.getCounts(req, res, next));
router.get('/:id', (req, res, next) => recordController.getById(req, res, next));
router.patch('/:id', (req, res, next) => recordController.update(req, res, next));

export default router;
