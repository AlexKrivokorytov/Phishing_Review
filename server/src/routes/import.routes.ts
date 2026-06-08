import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/ImportController';
import { ImportService } from '../services/ImportService';

const upload = multer({ dest: 'uploads/' });
const importController = new ImportController(new ImportService());

const router = Router();

router.post('/csv', upload.single('file'), (req, res, next) => importController.uploadFile(req, res, next));

export default router;