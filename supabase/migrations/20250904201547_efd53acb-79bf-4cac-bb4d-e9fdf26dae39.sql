-- Database cleanup to reset sessions data for fresh debugging
-- Delete all session-related data while preserving user profiles and course data

-- Delete all student reviews first (has foreign key references to sessions)
DELETE FROM public.student_reviews;

-- Delete all payment transactions  
DELETE FROM public.payment_transactions;

-- Delete all pending transfers
DELETE FROM public.pending_transfers;

-- Delete all sessions
DELETE FROM public.sessions;

-- Verify cleanup by counting remaining records
SELECT 
  'After cleanup:' as status,
  (SELECT COUNT(*) FROM public.sessions) as sessions_remaining,
  (SELECT COUNT(*) FROM public.payment_transactions) as payment_transactions_remaining,
  (SELECT COUNT(*) FROM public.pending_transfers) as pending_transfers_remaining,
  (SELECT COUNT(*) FROM public.student_reviews) as student_reviews_remaining,
  (SELECT COUNT(*) FROM public.profiles) as profiles_preserved,
  (SELECT COUNT(*) FROM public."courses-20251") as courses_preserved;