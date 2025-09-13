-- Add retry tracking columns to pending_transfers table
ALTER TABLE pending_transfers ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE pending_transfers ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;