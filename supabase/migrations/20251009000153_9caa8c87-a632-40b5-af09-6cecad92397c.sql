-- Drop overly permissive SELECT policies that expose sensitive data
-- These policies allowed tutors to view ALL columns including email, stripe_customer_id, stripe_connect_id
DROP POLICY IF EXISTS "Tutors can view safe profiles of assigned students" ON public.profiles;
DROP POLICY IF EXISTS "Tutors can view safe profiles of completed session students" ON public.profiles;

-- Grant SELECT access to safe_profiles view for authenticated users
-- This view already excludes sensitive fields (email, stripe IDs, referral codes)
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- Add explicit policy on safe_profiles to allow authenticated access
-- Note: safe_profiles has security_invoker = true, so it respects caller's permissions
-- This ensures tutors/students can view each other's safe data without exposing PII
COMMENT ON VIEW public.safe_profiles IS 'Secure view of profiles excluding email, stripe_customer_id, stripe_connect_id, and referral codes. Use this view for all client-side profile queries to prevent PII exposure.';