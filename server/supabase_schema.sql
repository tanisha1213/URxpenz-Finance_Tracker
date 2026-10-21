-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (optional)
-- DROP TABLE IF EXISTS budgets CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS loans CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "resetPasswordToken" TEXT,
  "resetPasswordExpire" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank')),
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 3. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('borrowed', 'lent')),
  "mainCategory" TEXT NOT NULL CHECK ("mainCategory" IN ('bank', 'personal')),
  "subCategory" TEXT NOT NULL,
  "lenderName" TEXT NOT NULL,
  "totalAmount" NUMERIC NOT NULL CHECK ("totalAmount" >= 0),
  "remainingAmount" NUMERIC NOT NULL CHECK ("remainingAmount" >= 0),
  "interestRate" NUMERIC DEFAULT 0 CHECK ("interestRate" >= 0),
  "emiAmount" NUMERIC DEFAULT 0 CHECK ("emiAmount" >= 0),
  "processingFee" NUMERIC DEFAULT 0 CHECK ("processingFee" >= 0),
  "totalInstallments" INTEGER DEFAULT 1,
  "installmentsPaid" INTEGER DEFAULT 0,
  "firstEmiDate" TIMESTAMPTZ,
  "nextDueDate" TIMESTAMPTZ,
  "dueDayOfMonth" INTEGER DEFAULT 1,
  "paymentFrequency" TEXT DEFAULT 'monthly',
  "paymentSourceId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "emiCategory" TEXT DEFAULT 'Bills',
  "notes" TEXT,
  "reminder7Days" BOOLEAN DEFAULT TRUE,
  "reminder3Days" BOOLEAN DEFAULT TRUE,
  "reminder1Day" BOOLEAN DEFAULT TRUE,
  "reminderDueDate" BOOLEAN DEFAULT TRUE,
  "reminderDailyOverdue" BOOLEAN DEFAULT TRUE,
  "startDate" TIMESTAMPTZ DEFAULT now(),
  "endDate" TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paid')),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Create installments table to track installments separately
CREATE TABLE IF NOT EXISTS loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "loanId" UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "installmentNumber" INTEGER NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  "dueDate" TIMESTAMPTZ NOT NULL,
  "paidDate" TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'missed', 'overdue')),
  "transactionId" UUID REFERENCES transactions(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  "paymentMethod" TEXT DEFAULT 'card' CHECK ("paymentMethod" IN ('cash', 'card', 'bank_transfer', 'upi', 'wallet', 'other')),
  "accountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "toAccountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "loanId" UUID REFERENCES loans(id) ON DELETE SET NULL,
  description TEXT,
  "transactionDate" TIMESTAMPTZ DEFAULT now(),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "monthlyBudget" NUMERIC NOT NULL CHECK ("monthlyBudget" >= 0),
  "categoryBudgets" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_type ON accounts("userId", type);
CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans("userId", status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions("userId", "transactionDate" DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions("userId", type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat ON transactions("userId", category);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets("userId");

-- Disable RLS for server-side REST API access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;

-- Explicit Grants for Supabase Data API (required for post-Oct 30 Data API access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
