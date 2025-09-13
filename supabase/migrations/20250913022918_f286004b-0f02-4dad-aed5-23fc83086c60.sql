-- Phase 2: Add foreign key constraints and performance indexes for pending_transfers

-- Add foreign key constraints
ALTER TABLE pending_transfers 
ADD CONSTRAINT fk_pending_transfers_session 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

ALTER TABLE pending_transfers 
ADD CONSTRAINT fk_pending_transfers_payment 
FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_pending_transfers_session_id ON pending_transfers(session_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_payment_id ON pending_transfers(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_status ON pending_transfers(status);
CREATE INDEX IF NOT EXISTS idx_sessions_completion_date ON sessions(completion_date);

-- Add indexes for transfer processor queries
CREATE INDEX IF NOT EXISTS idx_pending_transfers_status_retry ON pending_transfers(status, retry_count);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_last_retry ON pending_transfers(last_retry_at);

-- Add comments for documentation
COMMENT ON CONSTRAINT fk_pending_transfers_session ON pending_transfers IS 'Foreign key to sessions table with cascade delete';
COMMENT ON CONSTRAINT fk_pending_transfers_payment ON pending_transfers IS 'Foreign key to payment_transactions table with set null delete';