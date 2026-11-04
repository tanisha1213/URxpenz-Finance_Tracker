import crypto from 'crypto';
import User from '../models/User.js';
import { getUserSubscription, SUBSCRIPTION_PLANS, BASIC_TIER_LIMITS } from '../utils/subscriptionHelper.js';
import { saveStoredSubscription } from '../utils/subscriptionStore.js';
import { getUserReferralData, consumeReferralDiscount } from '../utils/referralStore.js';
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
    const referral = getUserReferralData(req.userId, user.name);

    return res.status(200).json({
      success: true,
      subscription,
      referral,
      plans: SUBSCRIPTION_PLANS,
      limits: BASIC_TIER_LIMITS,
      paymentConfig: {
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
        isLive: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subscription status'
    });
  }
};

/**
 * Create a Razorpay Order for a subscription plan
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const referral = getUserReferralData(req.userId);
    const discountPercent = referral?.discountPercent || 0; // 0, 5, 10, 15, 20, 25
    const originalPrice = plan.price;
    const discountAmount = discountPercent > 0 ? Math.round((originalPrice * discountPercent) / 100) : 0;
    const finalPrice = Math.max(1, originalPrice - discountAmount);

    const pricing = {
      originalPrice,
      finalPrice,
      discountPercent,
      discountAmount
    };

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(200).json({
        success: true,
        isConfigured: false,
        plan,
        pricing,
        message: 'Payment gateway is being initialized. All users currently enjoy 60-70 days of free Pro trial access!'
      });
    }

    // Call Razorpay API to generate order
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderData = {
      amount: finalPrice * 100, // Amount in paise (discounted)
      currency: 'INR',
      receipt: `rcpt_${req.userId.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        userId: req.userId,
        planId: plan.id,
        planName: plan.name,
        discountPercent: `${discountPercent}%`,
        discountAmount: `₹${discountAmount}`,
        finalPrice: `₹${finalPrice}`
      }
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`
      },
      body: JSON.stringify(orderData)
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.error?.description || 'Razorpay order creation failed');
    }

    return res.status(200).json({
      success: true,
      isDemoMode: false,
      order,
      keyId,
      plan,
      pricing
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

/**
 * Verify Razorpay payment signature & activate membership
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Incomplete payment data or gateway unconfigured.'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid cryptographic signature.'
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

    // Save to fallback store
    saveStoredSubscription(req.userId, {
      subscriptionTier: 'pro',
      subscriptionPlan: plan.id,
      subscriptionExpiresAt: newExpiresAt.toISOString()
    });

    // Attempt to update Supabase
    try {
      await supabase
        .from('users')
        .update({
          subscriptionTier: 'pro',
          subscriptionPlan: plan.id,
          subscriptionExpiresAt: newExpiresAt.toISOString()
        })
        .eq('id', req.userId);
    } catch (e) {
      // Ignored if column missing
    }

    user.subscriptionTier = 'pro';
    user.subscriptionPlan = plan.id;
    user.subscriptionExpiresAt = newExpiresAt.toISOString();

    const subscription = getUserSubscription(user);
    // Consume one-time referral discount upon purchase
    consumeReferralDiscount(req.userId);
    const referral = getUserReferralData(req.userId, user.name);

    return res.status(200).json({
      success: true,
      message: `Payment verified! ${plan.name} is now active until ${newExpiresAt.toLocaleDateString('en-IN')}.`,
      subscription,
      referral
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};

/**
 * Direct subscribe is disabled in production to protect subscription integrity.
 * All plan activations must go through verified payment transactions.
 */
export const subscribePlan = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Direct activation without verified payment is disabled. All users currently receive an automatic 60-day (or 70-day) free trial.'
  });
};

/**
 * Verify Google Play Store in-app purchase (for Play Store release)
 */
export const verifyGooglePlayPurchase = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Google Play In-App Billing is currently being configured in the Play Console. You are currently enjoying your 60-day Free Trial with all features unlocked.'
  });
};
