-- Fix transactions table to support all types used by the application

-- 1. Drop the restrictive CHECK constraint if it exists (was 'debit','credit','rollback' only)
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. No new type CHECK — the type column is free-form TEXT.
--    Values in use: generation, refund, subscription_reload, credit_purchase,
--                   admin_grant, admin_deduct, debit, credit, rollback

-- 3. Add stripe_event_id for idempotency dedup in the webhook
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_event_id
  ON public.transactions (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- 4. Add action column used by Profile page to display icon/label
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS action TEXT;
