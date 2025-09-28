-- Restore profiles visibility needed across the app while keeping public tutor visibility
-- 1) Clean up existing SELECT policies on profiles
DROP POLICY IF EXISTS "Public can view basic tutor info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view approved tutors" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Recreate minimal, clear SELECT policies
-- Self access
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Public access to approved tutors (keeps home page working)
CREATE POLICY "Public can view approved tutors"
ON public.profiles
FOR SELECT
USING (role = 'tutor'::user_role AND approved_tutor = true);

-- Connected profiles: allow users to view profiles of people they interact with
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
USING (
  -- always allow self
  id = auth.uid()
  OR
  -- approved tutors are public
  (role = 'tutor'::user_role AND approved_tutor = true)
  OR
  -- participants from sessions (either side)
  id IN (
    SELECT s.tutor_id FROM public.sessions s WHERE s.student_id = auth.uid()
    UNION
    SELECT s.student_id FROM public.sessions s WHERE s.tutor_id = auth.uid()
  )
  OR
  -- participants from conversations (either side)
  id IN (
    SELECT c.tutor_id FROM public.conversations c WHERE c.student_id = auth.uid()
    UNION
    SELECT c.student_id FROM public.conversations c WHERE c.tutor_id = auth.uid()
  )
  OR
  -- tutor-student relationships (either side)
  id IN (
    SELECT ts.student_id FROM public.tutor_students ts WHERE ts.tutor_id = auth.uid()
    UNION
    SELECT ts.tutor_id FROM public.tutor_students ts WHERE ts.student_id = auth.uid()
  )
);
