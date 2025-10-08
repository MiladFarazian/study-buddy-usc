
-- Drop the policy that allows public viewing of full profile data
DROP POLICY IF EXISTS "Public can view approved tutors who completed onboarding" ON public.profiles;

-- Create a secure view for public tutor discovery that excludes sensitive PII
CREATE OR REPLACE VIEW public.public_tutor_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  bio,
  tutor_bio,
  subjects,
  tutor_courses_subjects,
  hourly_rate,
  average_rating,
  graduation_year,
  major,
  available_in_person,
  available_online,
  approved_tutor,
  tutor_onboarding_complete,
  role
FROM public.profiles
WHERE approved_tutor = true 
  AND tutor_onboarding_complete = true;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.public_tutor_profiles IS 'Public view of approved tutors with sensitive PII (email, Stripe IDs) excluded for security';

-- Grant public read access to the view
GRANT SELECT ON public.public_tutor_profiles TO anon;
GRANT SELECT ON public.public_tutor_profiles TO authenticated;
