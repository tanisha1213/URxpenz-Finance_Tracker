import API from './api';

export const getReferralStats = () => API.get('/referral/stats');
export const validateReferralCode = (code) => API.get(`/referral/validate/${encodeURIComponent(code)}`);
