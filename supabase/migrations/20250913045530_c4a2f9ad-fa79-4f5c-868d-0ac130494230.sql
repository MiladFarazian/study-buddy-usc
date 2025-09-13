-- CRITICAL FINANCIAL DATA MIGRATION: Convert amounts to cents with safety checks
BEGIN;

-- 1) Create backup tables for safety
CREATE TABLE public.payment_transactions_backup AS SELECT * FROM public.payment_transactions;
CREATE TABLE public.pending_transfers_backup AS SELECT * FROM public.pending_transfers;

-- 2) payment_transactions: migrate amounts to integer cents
ALTER TABLE public.payment_transactions ADD COLUMN amount_cents integer;
ALTER TABLE public.payment_transactions ADD COLUMN platform_fee_cents integer;

-- Convert dollars to cents (multiply by 100)
UPDATE public.payment_transactions
SET amount_cents = ROUND(COALESCE(amount, 0) * 100)::integer;

UPDATE public.payment_transactions  
SET platform_fee_cents = ROUND(COALESCE(platform_fee, 0) * 100)::integer;

-- Replace old columns
ALTER TABLE public.payment_transactions DROP COLUMN amount;
ALTER TABLE public.payment_transactions RENAME COLUMN amount_cents TO amount;
ALTER TABLE public.payment_transactions ALTER COLUMN amount SET NOT NULL;

ALTER TABLE public.payment_transactions DROP COLUMN platform_fee;
ALTER TABLE public.payment_transactions RENAME COLUMN platform_fee_cents TO platform_fee;

COMMENT ON COLUMN public.payment_transactions.amount IS 'Amount in cents (e.g., 3090 = $30.90)';
COMMENT ON COLUMN public.payment_transactions.platform_fee IS 'Platform fee in cents';

-- 3) pending_transfers: migrate amounts to integer cents  
ALTER TABLE public.pending_transfers ADD COLUMN amount_cents integer;
ALTER TABLE public.pending_transfers ADD COLUMN platform_fee_cents integer;

-- Convert dollars to cents (multiply by 100)
UPDATE public.pending_transfers
SET amount_cents = ROUND(COALESCE(amount, 0) * 100)::integer;

UPDATE public.pending_transfers
SET platform_fee_cents = ROUND(COALESCE(platform_fee, 0) * 100)::integer;

-- Replace old columns
ALTER TABLE public.pending_transfers DROP COLUMN amount;
ALTER TABLE public.pending_transfers RENAME COLUMN amount_cents TO amount;
ALTER TABLE public.pending_transfers ALTER COLUMN amount SET NOT NULL;

ALTER TABLE public.pending_transfers DROP COLUMN platform_fee;
ALTER TABLE public.pending_transfers RENAME COLUMN platform_fee_cents TO platform_fee;

COMMENT ON COLUMN public.pending_transfers.amount IS 'Amount in cents (e.g., 3090 = $30.90)';
COMMENT ON COLUMN public.pending_transfers.platform_fee IS 'Platform fee in cents';

-- 4) Add error tracking columns and helpful indexes
ALTER TABLE public.pending_transfers
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS stripe_error_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pending_transfers_status ON public.pending_transfers(status);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_next_retry ON public.pending_transfers(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_stripe_error ON public.pending_transfers(stripe_error_code);

-- 5) Financial reconciliation view (values in cents)
CREATE OR REPLACE VIEW public.platform_revenue AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE status = 'completed') AS transfer_count,
  SUM(platform_fee) FILTER (WHERE status = 'completed') AS daily_platform_revenue_cents,
  SUM(amount) FILTER (WHERE status = 'completed') AS daily_tutor_payouts_cents,
  ROUND(SUM(platform_fee) FILTER (WHERE status = 'completed') / 100.0, 2) AS daily_platform_revenue_dollars,
  ROUND(SUM(amount) FILTER (WHERE status = 'completed') / 100.0, 2) AS daily_tutor_payouts_dollars
FROM public.pending_transfers
GROUP BY DATE(created_at);

-- 6) Verification queries (should show cents values)
DO $$
DECLARE
  sample_payment RECORD;
  sample_transfer RECORD;
BEGIN
  -- Verify a few sample conversions
  SELECT amount, id INTO sample_payment FROM public.payment_transactions LIMIT 1;
  SELECT amount, id INTO sample_transfer FROM public.pending_transfers LIMIT 1;
  
  RAISE NOTICE 'Sample payment_transaction amount (should be in cents): % for ID %', sample_payment.amount, sample_payment.id;
  RAISE NOTICE 'Sample pending_transfer amount (should be in cents): % for ID %', sample_transfer.amount, sample_transfer.id;
END $$;

COMMIT;