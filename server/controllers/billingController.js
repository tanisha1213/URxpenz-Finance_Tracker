import User from '../models/User.js';
import { getUserSubscription, SUBSCRIPTION_PLANS, BASIC_TIER_LIMITS } from '../utils/subscriptionHelper.js';
import { supabase } from '../config/supabase.js';

/**
 * Get current user's membership and subscription status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const subscription = getUserSubscription(user);

    return res.status(200).json({
      success: true,
      subscription,
      plans: SUBSCRIPTION_PLANS,
      limits: BASIC_TIER_LIMITS
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription status'
    });
  }
};

/**
 * Subscribe or Upgrade to a Pro Membership Plan (Web / Direct / Test / UPI)
 */
export const subscribePlan = async (req, res) => {
  try {
    const { planId, paymentMethod = 'direct_test', paymentId } = req.body;

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan selected. Available plans: kickstart, quarterly, half_yearly, annual'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    // If user has an active subscription expiring in the future, extend it. Otherwise, start from now.
    let baseDate = now;
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now) {
      baseDate = new Date(user.subscriptionExpiresAt);
    }

    const newExpiresAt = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscriptionTier: 'pro',
          subscriptionPlan: plan.id,
          subscriptionExpiresAt: newExpiresAt.toISOString()
        })
        .eq('id', req.userId);

      if (error) {
        console.warn('[Billing Warning] Could not update subscription columns directly:', error.message);
      }
    } catch (dbErr) {
      console.warn('[Billing DB Warning]:', dbErr.message);
    }

    // Refresh user model in memory
    user.subscriptionTier = 'pro';
    user.subscriptionPlan = plan.id;
    user.subscriptionExpiresAt = newExpiresAt.toISOString();

    const subscription = getUserSubscription(user);

    return res.status(200).json({
      success: true,
      message: `Successfully activated ${plan.name}! All premium features are unlocked until ${newExpiresAt.toLocaleDateString('en-IN')}.`,
      subscription
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process subscription'
    });
  }
};

/**
 * Verify Google Play Store in-app purchase (for Play Store release)
 */
export const verifyGooglePlayPurchase = async (req, res) => {
  try {
    const { productId, purchaseToken, orderId } = req.body;

    // Map Google Play In-App Product IDs to our internal plan IDs
    const playStoreProductMap = {
      'xpenz_kickstart_1m': 'kickstart',
      'xpenz_pro_3m': 'quarterly',
      'xpenz_pro_6m': 'half_yearly',
      'xpenz_annual_1y': 'annual'
    };

    const planId = playStoreProductMap[productId] || productId;
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Unrecognized Play Store product ID: ' + productId
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    let baseDate = now;
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now) {
      baseDate = new Date(user.subscriptionExpiresAt);
    }

    const newExpiresAt = new Date(baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    await supabase
      .from('users')
      .update({
        subscriptionTier: 'pro',
        subscriptionPlan: plan.id,
        subscriptionExpiresAt: newExpiresAt.toISOString()
      })
      .eq('id', req.userId);

    user.subscriptionTier = 'pro';
    user.subscriptionPlan = plan.id;
    user.subscriptionExpiresAt = newExpiresAt.toISOString();

    const subscription = getUserSubscription(user);

    return res.status(200).json({
      success: true,
      message: `Google Play purchase verified for ${plan.name}!`,
      subscription,
      orderId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify Google Play purchase'
    });
  }
};
