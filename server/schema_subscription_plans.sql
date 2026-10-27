-- Schema migration for User Membership & Subscription Plans
-- Run this in Supabase SQL Editor if columns are not yet present

ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'trial';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMPTZ DEFAULT (now() + interval '60 days');
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMPTZ;

-- Ensure fast lookup
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users ("subscriptionTier", "subscriptionExpiresAt");
