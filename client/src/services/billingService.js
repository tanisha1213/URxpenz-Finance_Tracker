import API from './api';

export const getBillingStatus = () => API.get('/billing/status');

export const createPaymentOrder = (planId) =>
  API.post('/billing/create-order', { planId });

export const verifyPaymentSignature = (verificationData) =>
  API.post('/billing/verify-payment', verificationData);

export const subscribePlan = (planId) =>
  API.post('/billing/subscribe', { planId });

export const verifyPlayStorePurchase = (purchaseData) =>
  API.post('/billing/verify-play-store', purchaseData);

