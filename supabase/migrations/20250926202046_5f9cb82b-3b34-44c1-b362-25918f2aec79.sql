-- 1) Create app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END$$;

-- 2) Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Security definer function to check role (idempotent)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- 4) Seed admin role for the known admin email if present
-- This is safe: only inserts when the user exists and role not already set
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE u.email = 'noah@studybuddyusc.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Grant admins SELECT on student_reviews and sessions via RLS
-- student_reviews
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_reviews' AND policyname = 'Admins can view all student reviews'
  ) THEN
    DROP POLICY "Admins can view all student reviews" ON public.student_reviews;
  END IF;
END$$;

CREATE POLICY "Admins can view all student reviews"
ON public.student_reviews
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'Admins can view all sessions'
  ) THEN
    DROP POLICY "Admins can view all sessions" ON public.sessions;
  END IF;
END$$;

CREATE POLICY "Admins can view all sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep RLS enforced
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;