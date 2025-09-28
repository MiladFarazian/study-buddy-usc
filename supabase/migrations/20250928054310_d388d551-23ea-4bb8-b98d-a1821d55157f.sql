-- Complete restoration to working state before complex RLS issues
-- Remove ALL existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view approved tutors" ON public.profiles; 
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic tutor info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view approved tutors" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create only two simple, reliable SELECT policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Public can view approved tutors"
ON public.profiles  
FOR SELECT
USING (role = 'tutor'::user_role AND approved_tutor = true);

-- Restore the missing user profile creation system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'student'::user_role);
  RETURN new;
END;
$$;

-- Recreate the trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing users
INSERT INTO public.profiles (id, role)
SELECT au.id, 'student'::user_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;