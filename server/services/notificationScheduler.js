import Loan from '../models/Loan.js';
import Subscription from '../models/Subscription.js';
import Insurance from '../models/Insurance.js';
import PushSubscriptionModel from '../models/PushSubscription.js';
import { sendPushNotification } from '../config/webPush.js';

// Cache to prevent duplicate push notifications on the same day
const dispatchedToday = new Set();

/**
 * Runs a check across all active loans, subscriptions, and insurances.
 * Dispatches Web Push notifications to any subscribed devices.
 */
export const checkAndDispatchReminders = async (targetUserId = null) => {
  const todayKey = new Date().toISOString().split('T')[0];
  let dispatchedCount = 0;

  try {
    // 1. Fetch active loans
    const loanQuery = { status: 'active' };
    if (targetUserId) loanQuery.userId = targetUserId;
    const loans = await Loan.find(loanQuery);

    for (const loan of loans) {
      if (!loan.nextDueDate) continue;

      const diffTime = new Date(loan.nextDueDate).getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let title = '';
      let body = '';
      let notify = false;

      if (diffDays < 0 && loan.reminderDailyOverdue !== false) {
        title = 'EMI Overdue! 🟥';
        body = `Your EMI of ₹${Number(loan.emiAmount || 0).toLocaleString()} for "${loan.title}" is overdue by ${Math.abs(diffDays)} days.`;
        notify = true;
      } else if (diffDays === 0 && loan.reminderDueDate !== false) {
        title = 'EMI Due Today ⏰';
        body = `Your EMI of ₹${Number(loan.emiAmount || 0).toLocaleString()} for "${loan.title}" is due today.`;
        notify = true;
      } else if (diffDays === 1 && loan.reminder1Day !== false) {
        title = 'EMI Due Tomorrow ⏰';
        body = `Your EMI of ₹${Number(loan.emiAmount || 0).toLocaleString()} for "${loan.title}" is due tomorrow.`;
        notify = true;
      } else if (diffDays > 1 && diffDays <= 3 && loan.reminder3Days !== false) {
        title = 'EMI Due in 3 Days 📅';
        body = `Your EMI of ₹${Number(loan.emiAmount || 0).toLocaleString()} for "${loan.title}" is due in ${diffDays} days.`;
        notify = true;
      } else if (diffDays > 3 && diffDays <= 7 && loan.reminder7Days !== false) {
        title = 'EMI Due in 7 Days 📅';
        body = `Your EMI of ₹${Number(loan.emiAmount || 0).toLocaleString()} for "${loan.title}" is due in ${diffDays} days.`;
        notify = true;
      }

      if (!notify) continue;

      const dedupeKey = `${todayKey}-loan-${loan.id || loan._id}-${diffDays}`;
      if (dispatchedToday.has(dedupeKey)) continue;

      const subscriptions = await PushSubscriptionModel.getSubscriptionsByUser(loan.userId);
      for (const sub of subscriptions) {
        try {
          await sendPushNotification(sub, {
            title,
            body,
            url: '/loans',
            tag: `loan-${loan.id || loan._id}`
          });
          dispatchedCount++;
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            // Subscription expired or unregistered by browser
            await PushSubscriptionModel.removeSubscription(sub.endpoint);
          }
        }
      }

      dispatchedToday.add(dedupeKey);
    }

    // 2. Fetch active subscriptions
    try {
      const subQuery = { status: 'active' };
      if (targetUserId) subQuery.userId = targetUserId;
      const subscriptionsList = await Subscription.find(subQuery);

      for (const sub of subscriptionsList) {
        if (!sub.nextBillingDate) continue;
        const diffTime = new Date(sub.nextBillingDate).getTime() - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 2) {
          const dedupeKey = `${todayKey}-sub-${sub.id || sub._id}-${diffDays}`;
          if (dispatchedToday.has(dedupeKey)) continue;

          const title = diffDays === 0 ? 'Subscription Due Today 🔄' : 'Subscription Upcoming 🔄';
          const body = `"${sub.title}" renewal of ₹${Number(sub.amount || 0).toLocaleString()} is due ${diffDays === 0 ? 'today' : `in ${diffDays} day(s)`}.`;

          const pushSubs = await PushSubscriptionModel.getSubscriptionsByUser(sub.userId);
          for (const s of pushSubs) {
            try {
              await sendPushNotification(s, {
                title,
                body,
                url: '/subscriptions',
                tag: `sub-${sub.id || sub._id}`
              });
              dispatchedCount++;
            } catch (pushErr) {
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                await PushSubscriptionModel.removeSubscription(s.endpoint);
              }
            }
          }

          dispatchedToday.add(dedupeKey);
        }
      }
    } catch (e) {
      // Subscriptions table might be empty or query notice
    }

    // 3. Clean up older cache entries at midnight
    if (dispatchedToday.size > 2000) {
      dispatchedToday.clear();
    }
  } catch (err) {
    console.error('[NotificationScheduler Error]:', err.message);
  }

  return dispatchedCount;
};

/**
 * Initializes a background timer to check reminders every 30 minutes
 */
export const initNotificationScheduler = () => {
  console.log('[NotificationScheduler] Background loan/bill reminder scheduler initialized.');

  // Run initial check after 5 seconds
  setTimeout(() => {
    checkAndDispatchReminders();
  }, 5000);

  // Repeat every 30 minutes
  setInterval(() => {
    checkAndDispatchReminders();
  }, 30 * 60 * 1000);
};

export default {
  checkAndDispatchReminders,
  initNotificationScheduler
};
