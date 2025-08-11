-- Tighten RLS on public.profiles to prevent harvesting of personal information

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policy allowing broad reads
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Public (including anonymous) can only view approved tutor profiles
CREATE POLICY "Public can view basic tutor info"
ON public.profiles
FOR SELECT
USING (
  role = 'tutor'::user_role AND approved_tutor = true
);

-- Authenticated users can also view approved tutor profiles
CREATE POLICY "Authenticated users can view approved tutors"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'tutor'::user_role AND approved_tutor = true
);
