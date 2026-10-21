import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'xpenz_default_jwt_secret_key_2026';

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '365d'
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email
});

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
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

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
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

    // Set expire (10 minutes from now)
    const expireDate = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = expireDate;

    await user.save();

    // Frontend reset password link
    const frontendResetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Attempt to deliver the reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, user.name, frontendResetUrl);
      console.log(`[Auth] Password reset email successfully delivered to ${normalizedEmail}`);

      return res.status(200).json({
        success: true,
        message: `A password reset link has been sent to ${normalizedEmail}. Please check your email inbox (and spam folder).`
      });
    } catch (mailError) {
      console.error(`[Auth Error] Failed to send password reset email:`, mailError.message);

      if (mailError.code === 'SMTP_NOT_CONFIGURED') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SMTP Warning] SMTP is not configured in server/.env. Add EMAIL_USER and EMAIL_PASS to enable live email delivery.`);
        }

        return res.status(503).json({
          success: false,
          message: 'Email service is not yet configured on this server. Please check your server SMTP settings.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset email. Please try again later.'
      });
    }
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