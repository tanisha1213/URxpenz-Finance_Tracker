import express from 'express';
import {
  getSubscriptionStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  subscribePlan,
  verifyGooglePlayPurchase
} from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/status', getSubscriptionStatus);
router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyRazorpayPayment);
router.post('/subscribe', subscribePlan);
router.post('/verify-play-store', verifyGooglePlayPurchase);

export default router;
