import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  clearAllOrders
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.delete('/all', clearAllOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;

