import express from 'express';
import {
  getDashboardStats,
  getCustomers,
  getActiveOtps,
  clearOtps,
  deleteOtp
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/customers', getCustomers);
router.get('/otps', getActiveOtps);
router.delete('/otps', clearOtps);
router.delete('/otps/:phone', deleteOtp);

export default router;

