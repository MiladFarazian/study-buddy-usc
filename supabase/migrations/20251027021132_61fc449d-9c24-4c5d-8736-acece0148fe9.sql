-- Drop existing view if it exists
DROP VIEW IF EXISTS public.public_tutor_profiles;

-- Create a security definer view for public tutor profiles
-- This safely exposes only approved tutor data without exposing sensitive PII
CREATE VIEW public.public_tutor_profiles 
WITH (security_invoker = false) AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.major,
  p.graduation_year,
  p.avatar_url,
  p.bio,
  p.tutor_bio,
  p.subjects,
  p.tutor_courses_subjects,
  p.approved_tutor,
  p.available_in_person,
  p.available_online,
  p.role,
  p.tutor_onboarding_complete,
  p.hourly_rate,
  p.average_rating
FROM public.profiles p
WHERE p.approved_tutor = true;

-- Grant SELECT access to authenticated and anonymous users
GRANT SELECT ON public.public_tutor_profiles TO authenticated, anon;

-- Add RLS policy to tutors table for authenticated users to view approved tutors
CREATE POLICY "Authenticated users can view approved tutors"
ON public.tutors
FOR SELECT
TO authenticated
USING (
  approved_tutor = true AND 
  (
    profile_visibility = 'public' OR
    (profile_visibility = 'course_match' AND EXISTS (
      SELECT 1 FROM public.student_courses sc
      JOIN public.tutor_courses tc ON sc.course_number = tc.course_number
      WHERE sc.student_id = auth.uid() AND tc.tutor_id = tutors.profile_id
    ))
  )
);

-- Add policy for anonymous users to view public approved tutors
CREATE POLICY "Anonymous users can view public approved tutors"
ON public.tutors
FOR SELECT
TO anon
USING (
  approved_tutor = true AND profile_visibility = 'public'
);