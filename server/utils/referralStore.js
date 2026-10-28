import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// Read referrals store
const readStore = () => {
  try {
    if (!fs.existsSync(REFERRALS_FILE)) return {};
    const content = fs.readFileSync(REFERRALS_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch (err) {
    return {};
  }
};

// Write referrals store
const writeStore = (data) => {
  try {
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[ReferralStore Save Error]:', err.message);
  }
};

/**
 * Generate a clean, human-readable referral code for a user
 * Example: XP-TANIS7A
 */
export const generateCode = (userId = '', name = '') => {
  const cleanName = (name || 'USER')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5);
  const cleanId = (userId || Math.random().toString(36).substring(2, 6))
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(-3);
  return `XP-${cleanName}${cleanId}`;
};

/**
 * Get or initialize referral data for a given user
 */
export const getUserReferralData = (userId, userName = '') => {
  if (!userId) {
    return {
      referralCode: 'URXPENZ-PROMO',
      referralCount: 0,
      discountPercent: 0,
      maxReferrals: 5,
      friendsReferred: [],
      hasReferralBonus: false
    };
  }

  const store = readStore();
  let userRef = store[userId];

  if (!userRef || !userRef.referralCode) {
    const code = generateCode(userId, userName);
    userRef = {
      referralCode: code,
      referralCount: userRef?.referralCount || 0,
      discountPercent: Math.min((userRef?.referralCount || 0) * 5, 25),
      maxReferrals: 5,
      friendsReferred: userRef?.friendsReferred || [],
      hasReferralBonus: userRef?.hasReferralBonus || false,
      updatedAt: new Date().toISOString()
    };
    store[userId] = userRef;
    writeStore(store);
  } else {
    // Recalculate discountPercent based on count
    userRef.discountPercent = Math.min((userRef.referralCount || 0) * 5, 25);
    userRef.maxReferrals = 5;
  }

  return userRef;
};

/**
 * Find a referrer by their referral code (case-insensitive)
 */
export const findReferrerByCode = (code) => {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  const store = readStore();

  for (const [userId, record] of Object.entries(store)) {
    if (record?.referralCode && record.referralCode.toUpperCase() === normalized) {
      return {
        userId,
        ...record
      };
    }
  }

  return null;
};

/**
 * Record a successful referral when a new user signs up with a valid code
 * Referrer gets +5% discount (capped at 5 referrals = 25% OFF)
 */
export const recordReferralSignup = ({ referrerId, newUserId, newUserName, newUserEmail }) => {
  if (!referrerId || !newUserId || referrerId === newUserId) return null;

  const store = readStore();
  const referrer = store[referrerId] || getUserReferralData(referrerId);

  // Prevent duplicate credit for the same new user
  const alreadyReferred = (referrer.friendsReferred || []).some(
    (f) => f.userId === newUserId || (newUserEmail && f.email === newUserEmail)
  );

  if (!alreadyReferred) {
    const currentCount = Number(referrer.referralCount) || 0;
    const newCount = Math.min(currentCount + 1, 5); // Capped at 5 friends max
    const newDiscount = newCount * 5; // 5%, 10%, 15%, 20%, 25%

    const maskedEmail = newUserEmail 
      ? newUserEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 5))}${c}`)
      : 'Friend';

    const updatedFriends = [
      ...(referrer.friendsReferred || []),
      {
        userId: newUserId,
        name: newUserName || 'URxpenz Member',
        emailMasked: maskedEmail,
        joinedAt: new Date().toISOString()
      }
    ];

    store[referrerId] = {
      ...referrer,
      referralCount: newCount,
      discountPercent: newDiscount,
      friendsReferred: updatedFriends,
      updatedAt: new Date().toISOString()
    };

    // Mark the new user as having received the 10-day bonus trial
    const newUserRecord = store[newUserId] || getUserReferralData(newUserId, newUserName);
    store[newUserId] = {
      ...newUserRecord,
      hasReferralBonus: true,
      referredBy: referrerId,
      bonusTrialDays: 10,
      updatedAt: new Date().toISOString()
    };

    writeStore(store);
    return store[referrerId];
  }

  return referrer;
};

/**
 * Consume referral discount when the user uses it to purchase / upgrade a plan
 * (One-time next-purchase discount)
 */
export const consumeReferralDiscount = (userId) => {
  if (!userId) return null;
  const store = readStore();
  const userRecord = store[userId];
  if (!userRecord) return null;

  const previousDiscount = userRecord.discountPercent || 0;

  // Reset discount and count for next referral cycle
  store[userId] = {
    ...userRecord,
    lastDiscountUsed: previousDiscount,
    lastDiscountUsedAt: new Date().toISOString(),
    referralCount: 0,
    discountPercent: 0,
    updatedAt: new Date().toISOString()
  };

  writeStore(store);
  return store[userId];
};
