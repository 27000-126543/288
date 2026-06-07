import { Router } from 'express';
import { getMonthlyReport, exportMonthlyReport } from '../controllers/reportController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/monthly', protect, authorize(UserRole.ADMIN), getMonthlyReport);
router.get('/monthly/export', protect, authorize(UserRole.ADMIN), exportMonthlyReport);

export default router;
