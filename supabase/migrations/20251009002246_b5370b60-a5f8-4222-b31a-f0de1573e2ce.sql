-- Fix profiles table RLS policies to restrict to authenticated users only
-- Drop the existing policy that allows public role access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate the policy with authenticated role only
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Verify no other policies allow public/anon access
-- All policies should now be restricted to authenticated role only

-- Add additional security comment
COMMENT ON TABLE public.profiles IS 'CRITICAL SECURITY: Contains PII (email, stripe IDs). RLS enabled. Only authenticated users can access their own profiles. Admins can view all profiles via has_role() check. Public browsing uses safe_profiles view only.';