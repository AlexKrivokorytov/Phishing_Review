import { Router } from 'express';
import { configController } from '../container';

const router = Router();

router.get('/', configController.getConfig.bind(configController));

export default router;
