import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBillingStatus, subscribePlan } from '../services/billingService';
import { updateUser } from '../redux/slices/authSlice';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [subscription, setSubscription] = useState(() => {
    return (
      user?.subscription || {
        tier: 'trial',
        isPro: true,
        isTrial: true,
        trialDaysRemaining: 60,
        limits: { maxAccounts: 1, maxLoans: 1, maxSubscriptions: 2 }
      }
    );
  });

  const [loading, setLoading] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getBillingStatus();
      if (res?.data?.subscription) {
        setSubscription(res.data.subscription);
        if (user) {
          dispatch(updateUser({
            ...user,
            subscription: res.data.subscription,
            referral: res.data.referral || user.referral
          }));
        }
      }
    } catch (err) {
      // If endpoint fails or offline, compute fallback from user creation date
      if (user?.createdAt) {
        const createdAt = new Date(user.createdAt);
        const trialDays = (user.hasReferralBonus || user.referral?.hasReferralBonus) ? 70 : 60;
        const trialEnd = user.subscription?.trialEndDate
          ? new Date(user.subscription.trialEndDate)
          : new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const isTrialActive = now < trialEnd;
        const remaining = isTrialActive
          ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)))
          : 0;

        setSubscription({
          tier: isTrialActive ? 'trial' : 'basic',
          isPro: isTrialActive,
          isTrial: isTrialActive,
          trialDaysRemaining: remaining,
          trialEndDate: trialEnd.toISOString(),
          limits: isTrialActive
            ? { maxAccounts: 9999, maxLoans: 9999, maxSubscriptions: 9999 }
            : { maxAccounts: 1, maxLoans: 1, maxSubscriptions: 2 }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshSubscription();
    }
  }, [isAuthenticated]);

  const openUpgradeModal = (feature = null) => {
    setUpgradeFeature(feature);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setUpgradeFeature(null);
  };

  const activatePlan = async (planPayload) => {
    try {
      setLoading(true);
      const res = await subscribePlan(planPayload);
      if (res?.data?.subscription) {
        setSubscription(res.data.subscription);
        if (user) {
          dispatch(updateUser({
            ...user,
            subscription: res.data.subscription,
            referral: res.data.referral || user.referral
          }));
        }
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to activate plan'
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        tier: subscription?.tier || 'basic',
        isPro: subscription?.isPro !== false,
        isTrial: !!subscription?.isTrial,
        trialDaysRemaining: subscription?.trialDaysRemaining || 0,
        limits: subscription?.limits || { maxAccounts: 1, maxLoans: 1, maxSubscriptions: 2 },
        loading,
        isUpgradeModalOpen,
        upgradeFeature,
        openUpgradeModal,
        closeUpgradeModal,
        activatePlan,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
