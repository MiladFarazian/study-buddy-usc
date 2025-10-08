
-- Update safe_profiles view to include tutor_bio for better functionality
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
