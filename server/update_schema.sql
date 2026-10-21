-- Drop old check constraints if they exist
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_type_check;
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;

-- Add new columns to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "processingFee" NUMERIC DEFAULT 0 CHECK ("processingFee" >= 0);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "totalInstallments" INTEGER DEFAULT 1;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "installmentsPaid" INTEGER DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "firstEmiDate" TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "nextDueDate" TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "dueDayOfMonth" INTEGER DEFAULT 1;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "paymentFrequency" TEXT DEFAULT 'monthly';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "paymentSourceId" UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "emiCategory" TEXT DEFAULT 'Bills';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "reminder7Days" BOOLEAN DEFAULT TRUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "reminder3Days" BOOLEAN DEFAULT TRUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "reminder1Day" BOOLEAN DEFAULT TRUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "reminderDueDate" BOOLEAN DEFAULT TRUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS "reminderDailyOverdue" BOOLEAN DEFAULT TRUE;

-- Add updated check constraint for status to support cancelled and completed
ALTER TABLE loans ADD CONSTRAINT loans_status_check CHECK (status IN ('active', 'completed', 'cancelled', 'paid'));

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

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_loan_installments_loan ON loan_installments("loanId");
CREATE INDEX IF NOT EXISTS idx_loan_installments_user ON loan_installments("userId", status);

-- Disable RLS and add explicit grants for loan_installments
ALTER TABLE loan_installments DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_installments TO anon, authenticated, service_role;
