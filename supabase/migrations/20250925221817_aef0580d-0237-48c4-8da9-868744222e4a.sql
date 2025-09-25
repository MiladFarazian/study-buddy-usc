-- Fix database schema to allow separate student and tutor reviews
-- Drop existing unique constraint if it exists and create a more flexible one
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_reviewer_session' AND conrelid = 'public.student_reviews'::regclass) THEN
        ALTER TABLE public.student_reviews DROP CONSTRAINT unique_reviewer_session;
    END IF;
    
    -- Create a more flexible unique constraint that allows both student and tutor to review
    -- This allows one record per session where either student OR tutor has filled their portion
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_reviews_session 
    ON public.student_reviews (session_id);
EXCEPTION
    WHEN duplicate_table THEN
        NULL; -- Index already exists
END $$;