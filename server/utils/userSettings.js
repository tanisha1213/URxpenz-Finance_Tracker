import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'user_settings.json');

let inMemorySettings = {};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// Read settings cache
const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(content || '{}');
      inMemorySettings = { ...inMemorySettings, ...parsed };
    }
    return inMemorySettings;
  } catch (err) {
    return inMemorySettings;
  }
};

// Write settings cache
const writeSettings = (data) => {
  inMemorySettings = { ...inMemorySettings, ...data };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Serverless read-only fallback: in-memory settings remain active and valid
  }
};

/**
 * Get user settings
 * @param {string} userId
 * @returns {Object}
 */
export const getUserSettings = (userId) => {
  if (!userId) return { dailyAlertTime: '20:00' };
  const all = readSettings();
  return all[userId] || { dailyAlertTime: '20:00' };
};

/**
 * Update user settings
 * @param {string} userId
 * @param {Object} partial
 * @returns {Object}
 */
export const saveUserSettings = (userId, partial = {}) => {
  if (!userId) return {};
  const all = readSettings();
  const current = all[userId] || { dailyAlertTime: '20:00' };
  all[userId] = { ...current, ...partial, updatedAt: new Date().toISOString() };
  writeSettings(all);
  return all[userId];
};
