-- =========================================================================
-- URxpenz Migration: Add Pro Subscription & Expiration Columns to users table
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "hasReferralBonus" BOOLEAN DEFAULT FALSE;

-- Optional performance indices
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users("subscriptionTier");
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users("subscriptionExpiresAt");

