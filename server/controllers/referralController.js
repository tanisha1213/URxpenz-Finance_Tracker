import User from '../models/User.js';
import {
  getUserReferralData,
  findReferrerByCode
} from '../utils/referralStore.js';

/**
 * Get current user's referral stats, code, and discount tier
 */
export const getMyReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const referralData = getUserReferralData(user._id, user.name);

    return res.status(200).json({
      success: true,
      data: referralData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch referral stats'
    });
  }
};

/**
 * Validate a referral code before signup (public)
 */
export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }

    const referrer = findReferrerByCode(code);
    if (!referrer) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid referral code'
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      code: referrer.referralCode,
      bonusDays: 10,
      message: 'Valid referral code! You will receive +10 Days Extra Free Trial (70 days total).'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate referral code'
    });
  }
};
