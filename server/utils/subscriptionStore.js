import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const SUB_FILE = path.join(DATA_DIR, 'user_subscriptions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

const readStore = () => {
  try {
    if (!fs.existsSync(SUB_FILE)) return {};
    const content = fs.readFileSync(SUB_FILE, 'utf8');
    return JSON.parse(content || '{}');
  } catch (err) {
    return {};
  }
};

const writeStore = (data) => {
  try {
    fs.writeFileSync(SUB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[SubscriptionStore Save Error]:', err.message);
  }
};

export const getStoredSubscription = (userId) => {
  if (!userId) return null;
  const all = readStore();
  return all[userId] || null;
};

export const saveStoredSubscription = (userId, data) => {
  if (!userId) return null;
  const all = readStore();
  all[userId] = {
    ...all[userId],
    ...data,
    updatedAt: new Date().toISOString()
  };
  writeStore(all);
  return all[userId];
};
