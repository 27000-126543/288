import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getCreditInfo,
  makePayment,
  getPaymentReminders,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/credit', protect, getCreditInfo);
router.get('/payment-reminders', protect, getPaymentReminders);
router.post('/payment', protect, makePayment);
router.get('/', protect, authorize(UserRole.ADMIN), getUsers);
router.get('/:id', protect, authorize(UserRole.ADMIN), getUserById);

export default router;
