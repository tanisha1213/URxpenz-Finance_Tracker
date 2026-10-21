-- Create Subscriptions Table for Recurring & Annual Plans
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Subscriptions',
  "billingCycle" TEXT DEFAULT 'monthly' CHECK ("billingCycle" IN ('monthly', 'quarterly', 'yearly')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  "startDate" TIMESTAMPTZ DEFAULT now(),
  "nextBillingDate" TIMESTAMPTZ NOT NULL,
  "accountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "autoDeduct" BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  "lastDeductedDate" TIMESTAMPTZ,
  description TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions("nextBillingDate");

-- Disable RLS to match server-side REST backend queries
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Explicit Grants for Supabase Data API (required for post-Oct 30 Data API access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO anon, authenticated, service_role;
