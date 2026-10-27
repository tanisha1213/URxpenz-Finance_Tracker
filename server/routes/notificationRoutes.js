import express from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
  triggerReminderCheck,
  triggerDailyBudgetCheck
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/send-test', protect, sendTestNotification);
router.post('/check-reminders', protect, triggerReminderCheck);
router.post('/test-daily-budget', protect, triggerDailyBudgetCheck);

export default router;
