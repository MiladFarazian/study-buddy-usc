-- Add refund tracking columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cancelled_by_user_id UUID REFERENCES profiles(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refund_amount INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS hours_before_session INTEGER;