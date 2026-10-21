import API from './api';

export const getVapidPublicKey = () => API.get('/notifications/vapid-public-key');

export const subscribeToPush = (subscription, userAgent) =>
  API.post('/notifications/subscribe', { subscription, userAgent });

export const unsubscribeFromPush = (endpoint) =>
  API.post('/notifications/unsubscribe', { endpoint });

export const sendTestPush = () => API.post('/notifications/send-test');

export const checkReminders = () => API.post('/notifications/check-reminders');
