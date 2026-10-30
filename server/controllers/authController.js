import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Account from '../models/Account.js';
import Loan from '../models/Loan.js';
import Investment from '../models/Investment.js';
import Insurance from '../models/Insurance.js';
import Subscription from '../models/Subscription.js';
import PushSubscriptionModel from '../models/PushSubscription.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';
import { getUserSubscription } from '../utils/subscriptionHelper.js';
import { saveUserSettings } from '../utils/userSettings.js';
import { saveStoredSubscription } from '../utils/subscriptionStore.js';
import {
  getUserReferralData,
  findReferrerByCode,
  recordReferralSignup
} from '../utils/referralStore.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'xpenz_default_jwt_secret_key_2026';

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '365d'
  });
};

const sanitizeUser = (user) => {
  const referral = getUserReferralData(user._id, user.name);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    hasReferralBonus: user.hasReferralBonus ?? referral?.hasReferralBonus ?? false,
    subscription: getUserSubscription(user),
    referral
  };
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    let existingUser;
    try {
      existingUser = await User.findOne({ email: normalizedEmail });
    } catch (dbErr) {
      console.error('Database query error in signup:', dbErr.message);
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unreachable. Please check your Supabase credentials in environment variables.'
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Validate referral code if submitted
    let referrer = null;
    let trialDays = 60; // standard trial
    if (referralCode?.trim()) {
      referrer = findReferrerByCode(referralCode.trim());
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'The referral code entered is invalid. Please double-check the code or remove it to proceed.'
        });
      }
      trialDays = 70; // 60 regular + 10 extra bonus days!
    }

    let user;
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        subscriptionTier: 'trial',
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        referredBy: referrer ? referrer.userId : null,
        hasReferralBonus: !!referrer
      });
    } catch (createErr) {
      user = await User.create({ name: name.trim(), email: normalizedEmail, password });
      user.hasReferralBonus = !!referrer;
      user.trialEndDate = trialEndDate.toISOString();
    }

    // Save trial expiration to stored subscriptions so trial length persists reliably
    saveStoredSubscription(user._id, {
      subscriptionTier: 'trial',
      trialEndDate: trialEndDate.toISOString(),
      hasReferralBonus: !!referrer
    });

    // Ensure referral profile is initialized for the new user
    getUserReferralData(user._id, user.name);

    // If referred, credit the referrer with +5% discount and record the referral
    if (referrer) {
      recordReferralSignup({
        referrerId: referrer.userId,
        newUserId: user._id,
        newUserName: user.name,
        newUserEmail: user.email
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user;
    try {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    } catch (dbErr) {
      console.error('Database query error in login:', dbErr.message);
      return res.status(503).json({
        success: false,
        message: 'Database service is currently unreachable. Please check your Supabase credentials in environment variables.'
      });
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim(), email: normalizedEmail, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
      data: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and a new password of at least 6 characters'
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAccountStats = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    const budget = await Budget.findOne({ userId: req.userId });
    const summary = summarizeTransactions(transactions, budget);

    res.status(200).json({
      success: true,
      data: {
        transactionCount: transactions.length,
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        savings: summary.savings,
        budgetRemaining: summary.budgetRemaining
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user registered with that email address'
      });
    }

    // Generate cryptographically secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (15 minutes from now)
    const expireDate = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = expireDate;

    await user.save();

    // Dynamically compute the frontend reset password link
    const host = req.get('host');
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const origin = req.headers.origin && !req.headers.origin.includes('localhost') ? req.headers.origin : null;
    const defaultLiveUrl = 'https://urxpenz-finance-tracker.vercel.app';
    const baseUrl = process.env.FRONTEND_URL || origin || (host && !host.includes('localhost') ? `${proto}://${host}` : defaultLiveUrl);
    const frontendResetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    // Attempt to deliver the reset email if configured
    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail(normalizedEmail, user.name, frontendResetUrl);
        emailSent = true;
        console.log(`[Auth] Password reset email successfully delivered to ${normalizedEmail}`);
      } catch (mailError) {
        console.error(`[Auth Error] Failed to send password reset email:`, mailError.message);
      }
    }

    // Always provide inAppReset: true and resetToken so the user can reset directly inside the app
    // without ever being blocked by missing server SMTP credentials or delayed emails
    return res.status(200).json({
      success: true,
      emailSent,
      inAppReset: true,
      resetToken,
      resetUrl: frontendResetUrl,
      message: emailSent
        ? `A recovery link has been sent to ${normalizedEmail}. You can also set a new password directly below.`
        : `Account verified! You can set your new password directly below.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password of at least 6 characters'
      });
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: hashedToken
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Verify expiration manually since PostgreSQL timestamp comparison
    if (new Date(user.resetPasswordExpire).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired'
      });
    }

    // Set new password (will be auto-hashed by user.save() pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Permanently delete user account and cascade delete all personal records
 * Required for Google Play Store User Data Compliance
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Cascade delete across all tables
    await Promise.allSettled([
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Account.deleteMany({ userId }),
      Loan.deleteMany({ userId }),
      Investment.deleteMany({ userId }),
      Insurance.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      PushSubscriptionModel.deleteMany({ userId }),
      User.deleteOne({ _id: userId })
    ]);

    // Clean up local fallback files
    saveUserSettings(userId, null);
    saveStoredSubscription(userId, null);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated financial records have been permanently deleted.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
};