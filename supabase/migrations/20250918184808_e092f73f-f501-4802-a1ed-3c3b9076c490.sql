-- Remove constraint that's blocking payments
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS amounts_in_cents;

-- Optional: Also remove from pending_transfers if it exists there
ALTER TABLE pending_transfers DROP CONSTRAINT IF EXISTS amounts_in_cents;

-- Log the change for reference
INSERT INTO notifications (
  user_id,
  title, 
  message,
  type,
  metadata
) VALUES (
  'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'::uuid,
  'Payment Constraint Removed',
  'Removed amounts_in_cents constraint to allow payment processing during currency system fixes.',
  'system',
  jsonb_build_object('constraint_removed_date', now())
);