import { Router } from 'express';
import {
  createInspectionReport,
  getMyInspectionReports,
  getInspectionByTraceCode,
  verifyReport,
} from '../controllers/inspectionController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/trace/:traceCode', getInspectionByTraceCode);
router.post('/verify', verifyReport);
router.get('/', protect, authorize(UserRole.MERCHANT, UserRole.ADMIN), getMyInspectionReports);
router.post('/', protect, authorize(UserRole.MERCHANT), createInspectionReport);

export default router;
