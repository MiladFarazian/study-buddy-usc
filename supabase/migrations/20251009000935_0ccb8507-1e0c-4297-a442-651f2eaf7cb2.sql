-- Explicitly revoke all access to profiles table for unauthenticated users
-- This ensures no table-level grants allow anon access to sensitive PII
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Only authenticated users should have potential access via RLS policies
-- RLS policies already restrict authenticated users to their own profiles only
GRANT SELECT ON public.profiles TO authenticated;

-- Add security comment to profiles table
COMMENT ON TABLE public.profiles IS 'CRITICAL: Contains sensitive PII (email, stripe_customer_id, stripe_connect_id, referral codes). Never expose to anon users. Client apps MUST use safe_profiles view instead.';

-- Ensure safe_profiles remains accessible for public profile browsing
-- (safe_profiles was already granted in previous migration, this is a safety check)
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;