// Routes for importing records. Handles uploading files.

import { Router } from 'express';
import multer from 'multer';
import { importController } from '../container';
import { config } from '../config';

const upload = multer({ dest: config.import.uploadDir });
const router = Router();

router.post('/file', upload.single('file'), importController.uploadFile.bind(importController));

export default router;