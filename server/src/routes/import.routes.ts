// Routes for importing records. Handles uploading files.

import { Router } from 'express';
import multer from 'multer';
import { importController } from '../container';
import { config } from '../config';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
  dest: config.import.uploadDir,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});
const router = Router();

router.post('/file', upload.single('file'), importController.uploadFile.bind(importController));

export default router;