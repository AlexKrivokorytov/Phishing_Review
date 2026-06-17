// Routes for record reviews. Allows fetching, viewing, and updating phishing records.

import { Router } from 'express';
import { recordController } from '../container';

const router = Router();

router.get('/',        recordController.getAll.bind(recordController));
router.get('/counts',  recordController.getCounts.bind(recordController));
router.get('/:id',     recordController.getById.bind(recordController));
router.patch('/:id',   recordController.update.bind(recordController));

export default router;
