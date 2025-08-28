-- Update the RLS policy to allow anyone who is the student_id in a session to submit reviews
-- This allows tutors to review other tutors when they're receiving tutoring
DROP POLICY IF EXISTS "Students can create their own reviews" ON public.student_reviews;

CREATE POLICY "Session participants can create reviews as students" 
ON public.student_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);