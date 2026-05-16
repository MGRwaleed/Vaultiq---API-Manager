import express from 'express';
import { getUsageStats } from '../controllers/usageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/stats', protect, getUsageStats);

export default router;