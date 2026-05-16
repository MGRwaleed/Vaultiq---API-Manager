import express from 'express';
import { getLogs, exportLogs } from '../controllers/logsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/',       getLogs);
router.get('/export', exportLogs);

export default router;