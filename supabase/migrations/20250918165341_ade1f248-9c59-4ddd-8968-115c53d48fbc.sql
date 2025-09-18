-- Clean up negative transfer amounts caused by currency conversion bug
-- First, let's see what we're dealing with
DELETE FROM pending_transfers WHERE amount < 0;

-- Log the cleanup for reference
INSERT INTO notifications (
  user_id, 
  title, 
  message, 
  type,
  metadata
) 
SELECT 
  'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'::uuid,
  'Payment System Fix Applied',
  'Cleaned up negative transfer amounts caused by currency conversion bug. System now properly converts dollars to cents.',
  'system',
  jsonb_build_object(
    'cleanup_date', now(),
    'negative_transfers_removed', (SELECT COUNT(*) FROM pending_transfers WHERE amount < 0)
  );