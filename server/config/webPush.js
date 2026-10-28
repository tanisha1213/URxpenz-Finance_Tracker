import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@urxpenz.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('[WebPush] VAPID keys initialized successfully.');
  } catch (err) {
    console.error('[WebPush Init Error]:', err.message);
  }
} else {
  console.warn('[WebPush Security Warning] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set in environment variables.');
}

/**
 * Send a web push notification to a specific browser subscription
 * @param {Object} subscription - Browser push subscription object
 * @param {Object} payload - { title, body, icon, url, data }
 */
export const sendPushNotification = async (subscription, payload) => {
  const formattedPayload = JSON.stringify({
    title: payload.title || 'URxpenz Notification',
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
