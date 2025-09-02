-- Add stripe_payment_intent_id column to payment_transactions table for better webhook matching
ALTER TABLE public.payment_transactions 
ADD COLUMN stripe_payment_intent_id TEXT;