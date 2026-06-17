// Routes for exporting records. Allows downloading data as JSON or CSV.

import { Router } from 'express';
import { exportController } from '../container';

const router = Router();

router.get('/json', exportController.getJson.bind(exportController));
router.get('/csv',  exportController.getCsv.bind(exportController));

export default router;
