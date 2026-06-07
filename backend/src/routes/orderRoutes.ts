import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getLogisticsRecommendations,
} from '../controllers/orderController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.post('/logistics-recommendations', protect, getLogisticsRecommendations);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

export default router;
