-- 1. Create Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mutual_fund', 'stock', 'fixed_deposit', 'recurring_deposit', 'gold', 'ppf', 'epf', 'nps', 'crypto', 'other')),
  title TEXT NOT NULL,
  "investedAmount" NUMERIC NOT NULL DEFAULT 0 CHECK ("investedAmount" >= 0),
  "currentValue" NUMERIC NOT NULL DEFAULT 0 CHECK ("currentValue" >= 0),
  "monthlySipAmount" NUMERIC DEFAULT 0 CHECK ("monthlySipAmount" >= 0),
  "sipDueDate" TIMESTAMPTZ,
  quantity NUMERIC DEFAULT 1 CHECK (quantity >= 0),
  "interestRate" NUMERIC DEFAULT 0 CHECK ("interestRate" >= 0),
  "maturityDate" TIMESTAMPTZ,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Insurances Table
CREATE TABLE IF NOT EXISTS insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('health', 'life', 'motor', 'home', 'travel', 'other')),
  insurer TEXT NOT NULL,
  "policyNumber" TEXT,
  title TEXT NOT NULL,
  "coverageAmount" NUMERIC NOT NULL DEFAULT 0 CHECK ("coverageAmount" >= 0),
  "premiumAmount" NUMERIC NOT NULL DEFAULT 0 CHECK ("premiumAmount" >= 0),
  "paymentFrequency" TEXT NOT NULL CHECK ("paymentFrequency" IN ('yearly', 'monthly', 'quarterly', 'half_yearly', 'one_time')),
  "renewalDate" TIMESTAMPTZ NOT NULL,
  "reminderDate" TIMESTAMPTZ,
  nominee TEXT,
  "policyDocumentUrl" TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments("userId");
CREATE INDEX IF NOT EXISTS idx_insurances_user ON insurances("userId");

-- Disable RLS to allow backend queries (consistent with other tables in this dev/test database setup)
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurances DISABLE ROW LEVEL SECURITY;

-- Explicit Grants for Supabase Data API (required for post-Oct 30 Data API access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurances TO anon, authenticated, service_role;
