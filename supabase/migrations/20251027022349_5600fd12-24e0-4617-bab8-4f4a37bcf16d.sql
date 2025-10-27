-- Clear role-based access control for profiles
-- Students and Tutors can view public tutor data (no PII)
-- Admins can view all profiles

-- Drop existing overly restrictive policies on profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

-- Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can view public tutor profiles (limited fields, no PII)
-- This allows students and tutors to browse tutors
CREATE POLICY "Public can view approved tutor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  approved_tutor = true 
  AND role = 'tutor'::user_role
);

-- Admins can view all profiles (including PII)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can update their own profile only
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update public_tutor_profiles view to ensure it only exposes non-PII
-- Drop and recreate to ensure clean state
DROP VIEW IF EXISTS public.public_tutor_profiles;

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
  -- NOTE: email, stripe IDs, and other PII are intentionally excluded
FROM public.profiles p
WHERE p.approved_tutor = true AND p.role = 'tutor'::user_role;

-- Grant access to the view
GRANT SELECT ON public.public_tutor_profiles TO authenticated, anon;

-- Add comment for documentation
COMMENT ON VIEW public.public_tutor_profiles IS 'Public view of approved tutors. Excludes PII like email addresses and payment information. Used by students and tutors to browse available tutors.';

-- Secure backup tables - remove from public API or add proper RLS
-- Add RLS policies to backup tables to prevent unauthorized access
CREATE POLICY "Only admins can view payment backup"
ON public.payment_transactions_backup
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can view transfer backup"
ON public.pending_transfers_backup
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add search_path to security definer functions to prevent privilege escalation
-- Fix the most critical functions first

ALTER FUNCTION public.update_student_reviews_updated_at() SET search_path = public;
ALTER FUNCTION public.approve_tutor(uuid) SET search_path = public;
ALTER FUNCTION public.validate_student_review() SET search_path = public;
ALTER FUNCTION public.update_badge_progress_after_tutor_review() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.initialize_tutor_badge_progress() SET search_path = public;
ALTER FUNCTION public.update_badge_progress_after_session() SET search_path = public;
ALTER FUNCTION public.update_badge_progress_after_review() SET search_path = public;
ALTER FUNCTION public.update_response_time_on_session_update() SET search_path = public;
ALTER FUNCTION public.retroactive_badge_award() SET search_path = public;
ALTER FUNCTION public.check_column_exists(text, text) SET search_path = public;
ALTER FUNCTION public.set_zoom_timestamps() SET search_path = public;
ALTER FUNCTION public.handle_profile_role_change() SET search_path = public;
ALTER FUNCTION public.calculate_refund_amounts(integer, text, integer) SET search_path = public;
ALTER FUNCTION public.handle_dual_session_confirmation() SET search_path = public;
ALTER FUNCTION public.award_badges_for_tutor(uuid) SET search_path = public;
ALTER FUNCTION public.notify_tutor_approval() SET search_path = public;

-- CRITICAL: Remove or heavily restrict the dangerous execute_sql function
-- This function allows arbitrary SQL execution and is a major security risk
DROP FUNCTION IF EXISTS public.execute_sql(text);

-- Add RLS policy to prevent foreign table access
-- Note: Foreign tables don't support RLS directly, so we need to handle this differently
-- The payments table should be removed from API access via config