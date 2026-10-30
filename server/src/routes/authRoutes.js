import express from 'express';
import {
  register,
  login,
  verifyOtp,
  verifyFirebasePhone,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/firebase-verify', verifyFirebasePhone);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

// Customer Profile & Address Book routes
router.get('/profile', optionalAuthenticate, getProfile);
router.put('/profile', optionalAuthenticate, updateProfile);
router.post('/addresses', optionalAuthenticate, addAddress);
router.delete('/addresses/:id', optionalAuthenticate, deleteAddress);
router.put('/addresses/:id/default', optionalAuthenticate, setDefaultAddress);

export default router;

