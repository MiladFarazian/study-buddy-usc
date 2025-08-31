-- Simplify payment_transactions table for Payment Links
ALTER TABLE public.payment_transactions
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS payment_intent_status,
DROP COLUMN IF EXISTS charge_id,
DROP COLUMN IF EXISTS transfer_status,
DROP COLUMN IF EXISTS transfer_id,
DROP COLUMN IF EXISTS payment_type,
DROP COLUMN IF EXISTS requires_transfer;

-- Add Payment Links specific columns
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_link_id TEXT,
ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;