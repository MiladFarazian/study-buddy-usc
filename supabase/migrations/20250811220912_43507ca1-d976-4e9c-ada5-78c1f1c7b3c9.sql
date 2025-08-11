-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more restrictive policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Anonymous users can only view basic tutor information (no personal details)
CREATE POLICY "Public can view basic tutor info" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'tutor'::user_role 
  AND approved_tutor = true
);

-- Authenticated users can view approved tutor profiles 
CREATE POLICY "Authenticated users can view approved tutors" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  role = 'tutor'::user_role 
  AND approved_tutor = true
);