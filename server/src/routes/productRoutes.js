import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleWeightStock,
  updatePriceAndQuantity,
  uploadProductImage
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-accessible routes (open or token-based)
router.post('/upload', uploadProductImage);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/toggle-stock', toggleWeightStock);
router.patch('/:id/price-quantity', updatePriceAndQuantity);

export default router;

