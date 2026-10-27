import { VAPID_PUBLIC_KEY, sendPushNotification } from '../config/webPush.js';
import PushSubscriptionModel from '../models/PushSubscription.js';
import User from '../models/User.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';
import { checkAndDispatchReminders, checkAndDispatchDailyBudgetSummaries } from '../services/notificationScheduler.js';

export const getVapidPublicKey = (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: VAPID_PUBLIC_KEY
  });
};

export const subscribe = async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription payload'
      });
    }

    const userId = req.user.id;
    await PushSubscriptionModel.saveSubscription(userId, subscription, userAgent);

    res.status(200).json({
      success: true,
      message: 'Subscribed to background push notifications successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscriptionModel.removeSubscription(endpoint);
    }
    res.status(200).json({
      success: true,
      message: 'Unsubscribed from push notifications'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = await PushSubscriptionModel.getSubscriptionsByUser(userId);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No active push subscription registered on the server yet. Please click "Enable Screen Alerts" first.'
      });
    }

    let successCount = 0;
    for (const sub of subscriptions) {
      try {
        await sendPushNotification(sub, {
          title: 'Xpenz Desktop & Mobile Alert 🚀',
          body: 'Native OS notifications are active! You will now receive loan due and EMI alerts even when the app is completely closed.',
          url: '/dashboard'
        });
        successCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscriptionModel.removeSubscription(sub.endpoint);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Test notification sent to ${successCount} device(s)!`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const triggerReminderCheck = async (req, res) => {
  try {
    const userId = req.user.id;
    const dispatched = await checkAndDispatchReminders(userId);
    res.status(200).json({
      success: true,
      message: `Loan and EMI reminder check completed. Dispatched: ${dispatched}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const triggerDailyBudgetCheck = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const subscription = getUserSubscription(user);
    if (!subscription.isPro) {
      return res.status(403).json({
        success: false,
        code: 'PRO_REQUIRED',
        message: 'Daily budget calculation and end-of-day prompts are an exclusive Pro feature. Basic tier includes monthly budgeting.'
      });
    }

    const userId = req.user.id;
    const dispatched = await checkAndDispatchDailyBudgetSummaries(userId, true);
    res.status(200).json({
      success: true,
      message: dispatched > 0
        ? `Daily budget notification dispatched to your device!`
        : `Daily budget checked. Ensure your browser screen alerts are enabled and budget is configured.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
