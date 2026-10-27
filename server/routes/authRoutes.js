import express from 'express';
import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAccountStats,
  forgotPassword,
  resetPassword,
  deleteAccount
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.get('/stats', protect, getAccountStats);
router.delete('/delete-account', protect, deleteAccount);

export default router;
