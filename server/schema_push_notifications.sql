-- Push Subscriptions Table for Desktop & Mobile OS Notifications (Works When App Is Closed)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions("userId");

-- Disable RLS and grant explicit permissions for Supabase PostgREST Data API
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated, service_role;
