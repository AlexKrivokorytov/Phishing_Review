import { Router } from 'express';
import { exportController } from '../container';

const router = Router();

router.get('/json', (req, res, next) => exportController.getJson(req, res, next));
router.get('/csv', (req, res, next) => exportController.getCsv(req, res, next));

export default router;
