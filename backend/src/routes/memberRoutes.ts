import { Router } from 'express';
import {
  getMemberInfo,
  checkLevelUpgrade,
  getMemberLevels,
} from '../controllers/memberController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getMemberInfo);
router.post('/check-upgrade', protect, checkLevelUpgrade);
router.get('/levels', getMemberLevels);

export default router;
