-- Currency Standardization Migration: Convert dollars to cents (Fixed)

-- First, convert dollar amounts to cents in payment_transactions
-- All amounts < 1000 are in dollars and need to be converted
UPDATE payment_transactions 
SET amount = amount * 100 
WHERE amount < 1000;

-- Convert dollar amounts to cents in pending_transfers  
-- All amounts < 1000 are in dollars and need to be converted
UPDATE pending_transfers 
SET amount = amount * 100, 
    platform_fee = COALESCE(platform_fee * 100, 0)
WHERE amount < 1000;

-- Now add constraints to ensure all future amounts are stored in cents (minimum 50 cents = $0.50)
ALTER TABLE payment_transactions 
ADD CONSTRAINT amounts_in_cents CHECK (amount >= 50);

ALTER TABLE pending_transfers 
ADD CONSTRAINT amounts_in_cents CHECK (amount >= 50);

-- Log the standardization
INSERT INTO notifications (
  user_id, 
  title, 
  message, 
  type,
  metadata
) VALUES (
  'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'::uuid,
  'Currency System Standardized',
  'All monetary values now stored in cents. Old $19 amounts converted to 1900 cents.',
  'system',
  jsonb_build_object(
    'standardization_date', now(),
    'currency_unit', 'cents',
    'conversion_applied', true
  )
);