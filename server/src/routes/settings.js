import express from 'express';
import { updateProfile, changePassword, getIntegrationInfo, deleteAccount } from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.patch('/profile',     updateProfile);
router.patch('/password',    changePassword);
router.get('/integration',   getIntegrationInfo);
router.delete('/account',    deleteAccount);

export default router;