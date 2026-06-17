// Routes for managing evidence tags.

import { Router } from 'express';
import { tagController } from '../container';

const router = Router();

router.get('/', tagController.getAllTags.bind(tagController));

export default router;
