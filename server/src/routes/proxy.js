import express from 'express';
import { proxyRequest } from '../controllers/proxyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(express.json({ limit: '50mb' }));

router.all('/:provider/*', protect, proxyRequest);

export default router;