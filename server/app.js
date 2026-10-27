import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import { initNotificationScheduler } from './services/notificationScheduler.js';

dotenv.config();

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost'
];

// Trust Vercel reverse proxy headers for per-client IP rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this device. Please wait a moment and try again.'
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const connectDB = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    console.log('Supabase connection verified');
  } catch (err) {
    console.error('Supabase connection error:', err.message);
    throw err;
  }
};

// Auto-connect database for serverless and local runs
connectDB().catch((err) => {
  console.error('Failed to initialize database connection:', err.message);
});

// Middleware to ensure DB connection is established before routing requests
app.use(async (req, res, next) => {
  try {
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Database check failed: ${err.message}`
    });
  }
});

// Auth-specific rate limiter (strict protection against brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
  }
});

// Deep sanitize request body and query to prevent XSS and prototype pollution
const sanitizeInput = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeInput);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

    if (typeof value === 'string') {
      clean[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeInput(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  next();
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/insurances', insuranceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/billing', billingRoutes);

// Initialize background loan & EMI reminder scheduler
initNotificationScheduler();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', env: process.env.NODE_ENV || 'development' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error(err.stack);
  } else {
    console.error('[Server Error]:', err.message);
  }

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    message: isProd && statusCode === 500 ? 'Internal Server Error' : (err.message || 'Something went wrong')
  });
});

export default app;
