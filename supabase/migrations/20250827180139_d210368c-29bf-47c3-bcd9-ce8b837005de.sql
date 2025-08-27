-- Remove the problematic unique constraint that prevents both student and tutor reviews for the same session
ALTER TABLE public.student_reviews DROP CONSTRAINT IF EXISTS unique_session_review;

-- Add a new constraint that allows one review per reviewer per session
-- This prevents the same person from submitting multiple reviews for the same session
-- but allows both student and tutor to review the same session
ALTER TABLE public.student_reviews ADD CONSTRAINT unique_reviewer_session 
UNIQUE (session_id, student_id, tutor_id);