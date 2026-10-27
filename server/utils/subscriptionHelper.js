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

  const now = new Date();
  const createdAt = user.createdAt ? new Date(user.createdAt) : now;

  // Calculate 60-day trial window
  const trialEnd = user.trialEndDate 
    ? new Date(user.trialEndDate) 
    : new Date(createdAt.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Check paid subscription
  const hasActivePaidPlan = !!(
    user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
  );

  // Check trial validity
  const isTrialActive = !hasActivePaidPlan && now < trialEnd;

  // Days remaining in trial
  const trialDaysRemaining = isTrialActive 
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isPro = hasActivePaidPlan || isTrialActive;
  const tier = hasActivePaidPlan ? 'pro' : (isTrialActive ? 'trial' : 'basic');

  return {
    tier, // 'trial' | 'pro' | 'basic'
    isPro,
    isTrial: isTrialActive,
    trialDaysRemaining,
    trialEndDate: trialEnd.toISOString(),
    plan: user.subscriptionPlan || (isTrialActive ? '60_day_trial' : 'basic'),
    expiresAt: hasActivePaidPlan ? user.subscriptionExpiresAt : (isTrialActive ? trialEnd.toISOString() : null),
    limits: isPro ? { maxAccounts: 9999, maxLoans: 9999, maxSubscriptions: 9999 } : BASIC_TIER_LIMITS
  };
};
