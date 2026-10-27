import API from './api';

export const getBillingStatus = () => API.get('/billing/status');

export const subscribePlan = (planId, paymentMethod = 'direct_test') =>
  API.post('/billing/subscribe', { planId, paymentMethod });

export const verifyPlayStorePurchase = (purchaseData) =>
  API.post('/billing/verify-play-store', purchaseData);
