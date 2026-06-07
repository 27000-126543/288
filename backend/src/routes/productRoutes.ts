import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSmartRecommendations,
  createPurchaseRequest,
  getMyPurchaseRequests,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.get('/', getProducts);
router.get('/recommendations', protect, getSmartRecommendations);
router.get('/purchase-requests', protect, getMyPurchaseRequests);
router.post('/purchase-requests', protect, authorize(UserRole.WHOLESALER), createPurchaseRequest);
router.get('/:id', getProductById);
router.post('/', protect, authorize(UserRole.MERCHANT, UserRole.ADMIN), createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
