import express from 'express';
import { checkSingleKey, checkAllKeys } from '../controllers/healthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.post('/check/:id',  checkSingleKey);
router.post('/check-all',  checkAllKeys);

export default router;