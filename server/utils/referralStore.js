import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, '..', 'data');
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');
let inMemoryStore = {};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// Read referrals store with memory caching
const readStore = () => {
  try {
    if (fs.existsSync(REFERRALS_FILE)) {
      const content = fs.readFileSync(REFERRALS_FILE, 'utf8');
      const parsed = JSON.parse(content || '{}');
      inMemoryStore = { ...inMemoryStore, ...parsed };
    }
    return inMemoryStore;
  } catch (err) {
    return inMemoryStore;
  }
};

// Write referrals store
const writeStore = (data) => {
  try {
    inMemoryStore = { ...inMemoryStore, ...data };
    fs.writeFileSync(REFERRALS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // If filesystem write fails on serverless, in-memory store remains active
    inMemoryStore = { ...inMemoryStore, ...data };
  }
};

/**
 * Generate a clean, human-readable referral code for a user
 * Example: XP-TANIS7A
 */
/**
 * Extract clean 2-3 uppercase initials from user name or email
 */
export const getUserInitials = (name = '', email = '') => {
  const cleanName = (name || '').trim().replace(/[^a-zA-Z\s]/g, '');
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      // First letter of each word (e.g., Tanisha Gandhi -> TG, John Doe -> JD)
      const initials = parts.map(p => p[0]).join('').slice(0, 3).toUpperCase();
      if (initials.length >= 2) return initials;
    } else if (parts.length === 1) {
      // Single name: first two letters (e.g., Tanisha -> TA, Rahul -> RA)
      if (parts[0].length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + 'X').toUpperCase();
    }
  }

  // Fallback to email username if name is not set
  if (email && typeof email === 'string' && email.includes('@')) {
    const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    if (emailPrefix.length >= 2) {
      return emailPrefix.substring(0, 2).toUpperCase();
    }
  }

  return 'UR';
};

/**
 * Generate a clean, human-readable referral code containing the user's initials
 * Example: UR-TG7K9, UR-TA8F2, UR-JD91C
 */
export const generateCode = (userId = '', name = '', email = '') => {
  const initials = getUserInitials(name, email);
  
  // Deterministic clean alphanumeric suffix from userId
  let seed = '';
  if (userId) {
    seed = String(userId).replace(/[^a-zA-Z0-9]/g, '');
  }
  if (seed.length < 4) {
    seed = ((name || '') + (email || '') + 'UR2026').replace(/[^a-zA-Z0-9]/g, '');
  }
  const cleanSuffix = seed.toUpperCase().slice(-4);
  
  return `UR-${initials}${cleanSuffix}`;
};

/**
 * Get or initialize referral data for a given user
 */
export const getUserReferralData = (userId, userName = '', userEmail = '') => {
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

  // If user has no referral code OR has legacy "XP-" code, regenerate with new initials format
  if (!userRef || !userRef.referralCode || userRef.referralCode.startsWith('XP-')) {
    const code = generateCode(userId, userName, userEmail);
    userRef = {
      ...(userRef || {}),
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
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const normalizedNoHyphen = normalized.replace(/-/g, '');
  const store = readStore();

  for (const [userId, record] of Object.entries(store)) {
    if (record?.referralCode) {
      const regCode = record.referralCode.toUpperCase();
      const regNoHyphen = regCode.replace(/-/g, '');
      if (regCode === normalized || regNoHyphen === normalizedNoHyphen) {
        return {
          userId,
          ...record
        };
      }
    }
  }

  // Graceful fallback for valid referral codes on cold serverless restarts
  if (
    normalized.startsWith('UR-') ||
    normalized.startsWith('XP-') ||
    normalized === 'URXPENZ' ||
    normalized === 'URXPENZ-PROMO'
  ) {
    return {
      userId: `referrer_${normalizedNoHyphen.toLowerCase()}`,
      referralCode: normalized,
      isPatternMatched: true
    };
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
