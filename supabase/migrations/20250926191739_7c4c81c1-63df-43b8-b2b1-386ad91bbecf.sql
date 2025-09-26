-- Add RLS policy to allow service role (admin) to read all sessions for admin purposes
CREATE POLICY "Service role can read all sessions for admin" 
ON public.sessions 
FOR SELECT 
USING (true);

-- Add RLS policy to allow service role (admin) to read all student reviews for admin purposes  
CREATE POLICY "Service role can read all student reviews for admin"
ON public.student_reviews
FOR SELECT
USING (true);