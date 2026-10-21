import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPHC8vieuheJ9exGTTlIxzzADsWEEfr_WivQERM5PD9jMLGdM05grEC9wjg4QWtu-pMreMUXZzPJ5WLD452VdT0';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '-G5KRfkRB2RmlYVgPO7SjEAjD3Q235jVYDacmTTg_1Q';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@xpenz.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[WebPush] VAPID keys initialized successfully.');
} catch (err) {
  console.error('[WebPush Init Error]:', err.message);
}

/**
 * Send a web push notification to a specific browser subscription
 * @param {Object} subscription - Browser push subscription object
 * @param {Object} payload - { title, body, icon, url, data }
 */
export const sendPushNotification = async (subscription, payload) => {
  const formattedPayload = JSON.stringify({
    title: payload.title || 'Xpenz Notification',
    body: payload.body || payload.message || 'You have an important update.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    url: payload.url || '/dashboard',
    timestamp: Date.now(),
    ...payload
  });

  return webpush.sendNotification(subscription, formattedPayload);
};

export default webpush;
