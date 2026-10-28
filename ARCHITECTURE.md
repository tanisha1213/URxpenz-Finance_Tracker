# URxpenz System Architecture & Security Specification

This document provides a comprehensive overview of the architecture, folder structure, security mechanisms, customizable notification scheduler, and subscription/payment flow for the **URxpenz** Personal Finance application.

---

## 1. Project Directory Structure

```text
urxpenz/
├── .gitignore                          # Comprehensive secrets and build exclusion rules
├── README.md                           # User manual and deployment instructions
├── ARCHITECTURE.md                     # Technical architecture & security specification
│
├── client/                             # React 18 + Vite Frontend Application
│   ├── index.html                      # Entry HTML with PWA meta tags & viewport configurations
│   ├── vite.config.js                  # Vite bundler configuration with manualChunks & PWA plugin
│   ├── src/
│   │   ├── main.jsx                    # React entry point with Redux Provider & Router
│   │   ├── App.jsx                     # Route declarations, Layout wrapper, and Auth guards
│   │   ├── components/                 # Modular, reusable UI components
│   │   │   ├── budget/                 # Budget components (DailyAlertTimeCard.jsx)
│   │   │   ├── common/                 # Common elements (Buttons, Cards, Inputs, Modals)
│   │   │   ├── layout/                 # Layout components (Navbar, Sidebar, Footer)
│   │   │   ├── subscription/           # UpgradeModal.jsx, pricing badges, plan cards
│   │   │   ├── transactions/           # Transaction form, tables, and filters
│   │   │   └── dashboard/              # Metrics overview, charts, upcoming payments
│   │   ├── hooks/                      # Custom hooks separating business logic from UI
│   │   │   ├── useDailyAlertSettings.js# Daily alert time validation, saving, and state
│   │   │   └── useDebounce.js          # Input debouncing hook for search and filtering
│   │   ├── context/                    # React Contexts
│   │   │   ├── SubscriptionContext.jsx # Membership tier state, trial countdown, activation
│   │   │   ├── LanguageContext.jsx     # Multi-language translation support
│   │   │   ├── ThemeContext.jsx        # Dark / Light theme persistence
│   │   │   └── NotificationContext.jsx # Web Push OS notifications & toast banners
│   │   ├── redux/                      # Redux Toolkit global state store
│   │   │   ├── store.js                # Configured Redux store
│   │   │   └── slices/                 # authSlice, budgetSlice, transactionSlice, etc.
│   │   ├── services/                   # Axios API services
│   │   │   ├── api.js                  # Centralized Axios instance with auth interceptors
│   │   │   ├── billingService.js       # Billing status, Razorpay order & verification
│   │   │   ├── budgetService.js        # Budget CRUD & customizable alert time APIs
│   │   │   ├── transactionService.js   # Transaction CRUD endpoints
│   │   │   └── notificationService.js  # Push subscription management
│   │   └── utils/                      # Formatting helpers and static data
│   │       ├── format.js               # Currency (INR) and date formatting
│   │       └── welfareData.js          # Official government schemes & portals
│
└── server/                             # Node.js + Express Backend API
    ├── server.js                       # HTTP server entry listener
    ├── app.js                          # Express application with security middleware
    ├── schema_subscription_plans.sql   # Supabase SQL migration for subscription columns
    ├── config/
    │   ├── supabase.js                 # Supabase client initialized strictly from env vars
    │   └── webPush.js                  # VAPID web-push initialized strictly from env vars
    ├── middleware/
    │   └── authMiddleware.js           # JWT verification & multi-tenant user isolation (req.userId)
    ├── models/
    │   ├── adapter.js                  # Supabase PostgreSQL model adapter with bcrypt
    │   ├── User.js                     # User entity adapter
    │   ├── Transaction.js              # Transaction entity adapter
    │   ├── Budget.js                   # Budget entity adapter
    │   ├── Account.js                  # Bank and Cash account adapter
    │   ├── Loan.js                     # Loan & EMI installment adapter
    │   ├── Subscription.js             # Recurring subscriptions adapter
    │   └── PushSubscription.js         # Browser push subscription storage
    ├── controllers/
    │   ├── authController.js           # Signup, login, password reset (bcrypt & JWT)
    │   ├── billingController.js        # Razorpay order, signature verification & tiers
    │   ├── budgetController.js         # Monthly & Daily budget limits + customizable alert time
    │   ├── transactionController.js    # Strict user-isolated transaction CRUD
    │   ├── accountController.js        # Bank account limits and balance adjustments
    │   ├── loanController.js           # Loan calculation and installment tracking
    │   └── notificationController.js   # Push registration and notification dispatch
    ├── services/
    │   ├── notificationScheduler.js    # Automated scheduler for loans & customizable daily alerts
    │   ├── financeAnalyzer.js          # Deterministic financial analytics & calculations
    │   └── aiService.js                # Spend forecasting and runway analysis
    └── utils/
        ├── subscriptionHelper.js       # Subscription rules, limits, and trial calculator
        ├── subscriptionStore.js        # Guaranteed fallback persistence for subscriptions
        ├── userSettings.js             # User preferences & customizable daily alert times
        └── sendEmail.js                # Nodemailer password reset delivery
```

---

## 2. Security Hardening & Defenses

1. **Strict Secret Isolation**:
   - Zero hardcoded fallback secrets in source code (`server/config/supabase.js`, `server/config/webPush.js`).
   - `.gitignore` rigorously protects all `.env`, `*.env`, `.env.*`, `client/.env*`, `server/.env*`, `*.pem`, `*.key`, and `server/data/`.
2. **Authentication & Multi-Tenant Authorization**:
   - Passwords hashed with `bcrypt` (10 salt rounds).
   - JWT tokens signed using high-entropy `JWT_SECRET` with configurable expiry.
   - All protected routes enforce `authMiddleware.js`. Every database operation strictly scopes by `userId: req.userId` to eliminate Insecure Direct Object References (IDOR).
3. **Brute-Force & Denial-of-Service Protection**:
   - `express-rate-limit` enforces strict limits on `/api/auth` (max 20 requests per 15 minutes per client IP).
   - Global rate limiter on `/api` routes (max 1000 requests per 15 minutes).
4. **Injection & Cross-Site Scripting (XSS) Mitigation**:
   - Recursive input sanitizer scrubs request bodies and query parameters of malicious `<script>` tags and `javascript:` URIs.
   - Blocks prototype pollution by rejecting `__proto__`, `constructor`, and `prototype` overwrites.
5. **Security Headers**:
   - `helmet()` automatically injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict referer policies.
6. **Production Error Masking**:
   - When `NODE_ENV === 'production'`, internal stack traces and database error codes are hidden from responses, returning clean generic error messages.

---

## 3. Customizable Daily Budget Alert Workflow

Users can specify the exact time they wish to receive end-of-day budget prompts (e.g. `21:00`, `20:30`, or whatever time fits their schedule).

1. **User Setting**: The user configures their preferred time via the `<DailyAlertTimeCard />` component in the Budget tab.
2. **API Endpoint**: `PATCH /api/budget/alert-time` validates the 24-hour `HH:mm` format and persists the setting in `server/data/user_settings.json` and Supabase.
3. **Scheduler**: `notificationScheduler.js` checks every 15 minutes:
   - For each active budget, calculates `targetMinutes = alertHour * 60 + alertMinute`.
   - Compares with the current time `now.getHours() * 60 + now.getMinutes()`.
   - If current time has reached the user's configured time and an alert has not yet been dispatched today, dispatches a Web Push OS notification.
   - If spent `<= dailyBudget`: prompts *"You saved ₹X today! 🎉"*.
   - If spent `> dailyBudget`: prompts *"You overspent by ₹X today. ⚠️"*.

---

## 4. Subscription & Payment Integration Guide

### Step 1: Execute Supabase SQL Migration
Run the following SQL in your **Supabase Dashboard > SQL Editor** to add the membership columns:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'trial';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMPTZ DEFAULT (now() + interval '60 days');
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_subscription ON users ("subscriptionTier", "subscriptionExpiresAt");
```

*(Note: Even before running this SQL, URxpenz includes automated fallback persistence in `server/data/user_subscriptions.json` so subscriptions never crash or fail to persist).*

### Step 2: Configure Razorpay for Web / UPI Payments
1. Create a free account at [https://razorpay.com](https://razorpay.com).
2. Go to **Settings > API Keys** and generate a **Key ID** and **Key Secret**.
3. Add these credentials to your `server/.env`:
   ```ini
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_secret_here
   ```
4. Restart your backend server (`npm run dev` or `npm start`).
5. In `UpgradeModal.jsx`, clicking **Activate Plan** will automatically launch the Razorpay Checkout popup supporting UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and NetBanking.
6. The backend cryptographically verifies the payment signature using HMAC SHA256 before granting Pro status.

### Step 3: Google Play Store In-App Purchases (for Mobile Release)
When packaging URxpenz using Capacitor or Android Studio:
1. In the Google Play Console, create In-App Subscriptions matching your plan IDs:
   - `xpenz_kickstart_1m` (Kickstart 1 Month - ₹45)
   - `xpenz_pro_3m` (Quarterly 3 Months - ₹119)
   - `xpenz_pro_6m` (Half-Yearly 6 Months - ₹199)
   - `xpenz_annual_1y` (Annual Pro 1 Year - ₹349)
2. The endpoint `POST /api/billing/verify-play-store` receives Google Play purchase tokens, verifies them, and activates membership.

---

## 5. Security Audit Findings & Secret Rotation Recommendation

During our repository audit:
- An anon Supabase key was identified in older git commit `ef517a1`.
- **Recommended Action**:
  1. Open your **Supabase Dashboard > Project Settings > API**.
  2. Click **Reset API Key** to generate a fresh `anon` key.
  3. Update `SUPABASE_KEY` in your local `server/.env` file.
  4. Ensure your `server/.env` file is never removed from `.gitignore`.
