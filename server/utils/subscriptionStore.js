import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless ? '/tmp' : path.join(__dirname, '..', 'data');
const SUB_FILE = path.join(DATA_DIR, 'user_subscriptions.json');

let inMemoryStore = {};

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
    if (fs.existsSync(SUB_FILE)) {
      const content = fs.readFileSync(SUB_FILE, 'utf8');
      const parsed = JSON.parse(content || '{}');
      inMemoryStore = { ...inMemoryStore, ...parsed };
    }
    return inMemoryStore;
  } catch (err) {
    return inMemoryStore;
  }
};

const writeStore = (data) => {
  inMemoryStore = { ...inMemoryStore, ...data };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Serverless read-only fallback: in-memory store remains active and valid
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
