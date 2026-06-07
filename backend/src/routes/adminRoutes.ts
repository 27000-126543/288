import { Router } from 'express';
import {
  getDashboardStats,
  getPriceForecast,
  getInventoryWarnings,
  getMemberActivity,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/dashboard', protect, authorize(UserRole.ADMIN), getDashboardStats);
router.get('/price-forecast', protect, authorize(UserRole.ADMIN, UserRole.WHOLESALER), getPriceForecast);
router.get('/inventory-warnings', protect, authorize(UserRole.ADMIN), getInventoryWarnings);
router.get('/member-activity', protect, authorize(UserRole.ADMIN), getMemberActivity);

export default router;
