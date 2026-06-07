import { Router } from 'express';
import {
  getMyInventory,
  updateInventory,
  createInventory,
  getInventoryAlerts,
} from '../controllers/inventoryController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/', protect, authorize(UserRole.MERCHANT), getMyInventory);
router.get('/alerts', protect, authorize(UserRole.MERCHANT), getInventoryAlerts);
router.post('/', protect, authorize(UserRole.MERCHANT), createInventory);
router.put('/:id', protect, authorize(UserRole.MERCHANT), updateInventory);

export default router;
