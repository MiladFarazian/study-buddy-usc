-- Remove the overly permissive policies we just created
DROP POLICY IF EXISTS "Service role can read all sessions for admin" ON public.sessions;
DROP POLICY IF EXISTS "Service role can read all student reviews for admin" ON public.student_reviews;

-- Create more appropriate policies for admin access
-- These policies will work when using the service role key (which admin interfaces should use)
CREATE POLICY "Admin can read all sessions" 
ON public.sessions 
FOR SELECT 
USING (
  -- Allow if user is service role or if it's their own session data
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() = student_id OR 
  auth.uid() = tutor_id
);

CREATE POLICY "Admin can read all student reviews"
ON public.student_reviews
FOR SELECT
USING (
  -- Allow if user is service role or if it's their own review data
  auth.jwt() ->> 'role' = 'service_role' OR 
  auth.uid() = student_id OR 
  auth.uid() = tutor_id
);