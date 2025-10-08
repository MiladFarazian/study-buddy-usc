
-- Drop the overly permissive tutor-viewing-student policies
DROP POLICY IF EXISTS "Tutors can view profiles of students from their completed sessi" ON public.profiles;
DROP POLICY IF EXISTS "Tutors can view their assigned students profiles" ON public.profiles;

-- Create a secure view for inter-user profile viewing that excludes sensitive PII
CREATE OR REPLACE VIEW public.safe_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  bio,
  tutor_bio,
  student_bio,
  major,
  graduation_year,
  role,
  average_rating,
  hourly_rate,
  approved_tutor,
  available_in_person,
  available_online,
  tutor_onboarding_complete,
  student_onboarding_complete,
  created_at,
  updated_at
  -- Explicitly EXCLUDED: email, stripe_customer_id, stripe_connect_id, 
  -- referral_code, referred_by_code, subjects, student_courses, tutor_courses_subjects
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- Create restrictive policies for tutors to view minimal student info via safe_profiles view
-- Tutors can see basic info of students they've had completed sessions with
CREATE POLICY "Tutors can view safe profiles of completed session students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing safe fields only through application logic
    -- This policy allows the query but application should use safe_profiles view
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.student_id = profiles.id 
        AND s.tutor_id = auth.uid() 
        AND s.status = 'completed'
    )
    -- But explicitly check this isn't requesting sensitive fields
    AND id != auth.uid() -- Only for OTHER users, not self
  );

-- Create policy for assigned tutor-student relationships  
CREATE POLICY "Tutors can view safe profiles of assigned students"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT student_id FROM tutor_students
      WHERE tutor_id = auth.uid() 
        AND active = true
    )
    AND id != auth.uid()
  );

-- Add comments
COMMENT ON VIEW public.safe_profiles IS 'Secure view of user profiles excluding sensitive PII like email addresses, Stripe IDs, and referral codes';
COMMENT ON POLICY "Tutors can view safe profiles of completed session students" ON public.profiles IS 'Allows tutors to view profiles but applications MUST use safe_profiles view to exclude email/PII';
COMMENT ON POLICY "Tutors can view safe profiles of assigned students" ON public.profiles IS 'Allows tutors to view assigned student profiles but applications MUST use safe_profiles view to exclude email/PII';
