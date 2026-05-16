import express from 'express';
import { getKeys, addKey, revealKey, toggleKey, updateKey, deleteKey } from '../controllers/apiKeyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // all routes protected

router.get('/',           getKeys);
router.post('/',          addKey);
router.get('/:id/reveal', revealKey);
router.patch('/:id/toggle', toggleKey);
router.patch('/:id',      updateKey);
router.delete('/:id',     deleteKey);

export default router;
