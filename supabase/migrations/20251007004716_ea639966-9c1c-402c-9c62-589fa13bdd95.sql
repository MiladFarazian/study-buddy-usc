-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Public can view approved tutors" ON public.profiles;

-- Create new simplified policy
CREATE POLICY "Public can view approved tutors who completed onboarding"
ON public.profiles
FOR SELECT
USING (
  approved_tutor = true 
  AND tutor_onboarding_complete = true
);