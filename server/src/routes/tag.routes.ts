import { Router } from 'express';
import { tagController } from '../container';

const router = Router();

router.get('/', tagController.getAllTags);

export default router;
