// Routes for importing records. Handles uploading files.

import { Router } from 'express';
import multer from 'multer';
import { importController } from '../container';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/file', upload.single('file'), importController.uploadFile.bind(importController));

export default router;