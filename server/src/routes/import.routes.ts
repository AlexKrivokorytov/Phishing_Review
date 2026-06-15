import { Router } from 'express';
import multer from 'multer';
import { importController } from '../container';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post('/file', upload.single('file'), (req, res, next) =>
  importController.uploadFile(req, res, next),
);

export default router;