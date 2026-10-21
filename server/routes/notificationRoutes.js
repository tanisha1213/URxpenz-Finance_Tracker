import express from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
  triggerReminderCheck
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/send-test', protect, sendTestNotification);
router.post('/check-reminders', protect, triggerReminderCheck);

export default router;
