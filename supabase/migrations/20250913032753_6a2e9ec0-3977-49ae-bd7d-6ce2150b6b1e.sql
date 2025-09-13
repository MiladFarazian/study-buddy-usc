-- Add stripe_transfer_id column to pending_transfers table
ALTER TABLE pending_transfers 
ADD COLUMN IF NOT EXISTS stripe_transfer_id text;

-- Add index for stripe_transfer_id lookups
CREATE INDEX IF NOT EXISTS idx_pending_transfers_stripe_id ON pending_transfers(stripe_transfer_id);

-- Add comment for documentation
COMMENT ON COLUMN pending_transfers.stripe_transfer_id IS 'Stripe transfer ID returned from successful stripe.transfers.create() call';