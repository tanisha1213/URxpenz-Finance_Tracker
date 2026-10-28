/**
 * Helper to compute user subscription and trial status
 */

export const SUBSCRIPTION_PLANS = {
  kickstart: {
    id: 'kickstart',
    name: 'Kickstart Plan',
    durationDays: 30,
    price: 45,
    label: '1 Month',
    badge: 'Popular'
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Pro',
    durationDays: 90,
    price: 119,
    label: '3 Months',
    savings: '13% OFF'
  },
  half_yearly: {
    id: 'half_yearly',
    name: 'Half-Yearly Pro',
    durationDays: 180,
    price: 199,
    label: '6 Months',
    savings: '26% OFF'
  },
  annual: {
    id: 'annual',
    name: 'Annual Pro',
    durationDays: 365,
    price: 349,
    label: '1 Year',
    savings: '35% OFF',
    badge: 'Best Value'
  }
};

export const BASIC_TIER_LIMITS = {
  maxAccounts: 1,
  maxLoans: 1,
  maxSubscriptions: 2
};

import { getStoredSubscription } from './subscriptionStore.js';

export const getUserSubscription = (user) => {
  if (!user) {
    return {
      tier: 'basic',
      isPro: false,
      isTrial: false,
      trialDaysRemaining: 0,
      limits: BASIC_TIER_LIMITS
    };
  }

  const userId = user._id || user.id;
  const stored = getStoredSubscription(userId);

  const effectiveSubscriptionExpiresAt = user.subscriptionExpiresAt || stored?.subscriptionExpiresAt;
  const effectiveSubscriptionPlan = user.subscriptionPlan || stored?.subscriptionPlan;
  const effectiveSubscriptionTier = user.subscriptionTier || stored?.subscriptionTier;

  const now = new Date();
  const createdAt = user.createdAt ? new Date(user.createdAt) : now;

  const effectiveTrialEndDate = user.trialEndDate || stored?.trialEndDate;

  // Calculate trial window (defaults to 60 days, or 70 days if registered with referral code)
  const defaultTrialDays = (user.hasReferralBonus || stored?.hasReferralBonus) ? 70 : 60;
  const trialEnd = effectiveTrialEndDate 
    ? new Date(effectiveTrialEndDate) 
    : new Date(createdAt.getTime() + defaultTrialDays * 24 * 60 * 60 * 1000);

  // Check paid subscription
  const hasActivePaidPlan = !!(
    effectiveSubscriptionExpiresAt && new Date(effectiveSubscriptionExpiresAt) > now
  );

  // Check trial validity
  const isTrialActive = !hasActivePaidPlan && now < trialEnd;

  // Days remaining in trial
  const trialDaysRemaining = isTrialActive 
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isPro = hasActivePaidPlan || isTrialActive;
  const tier = hasActivePaidPlan ? (effectiveSubscriptionTier || 'pro') : (isTrialActive ? 'trial' : 'basic');

  return {
    tier, // 'trial' | 'pro' | 'basic'
    isPro,
    isTrial: isTrialActive,
    trialDaysRemaining,
    trialEndDate: trialEnd.toISOString(),
    plan: effectiveSubscriptionPlan || (isTrialActive ? '60_day_trial' : 'basic'),
    expiresAt: hasActivePaidPlan ? effectiveSubscriptionExpiresAt : (isTrialActive ? trialEnd.toISOString() : null),
    limits: isPro ? { maxAccounts: 9999, maxLoans: 9999, maxSubscriptions: 9999 } : BASIC_TIER_LIMITS
  };
};
