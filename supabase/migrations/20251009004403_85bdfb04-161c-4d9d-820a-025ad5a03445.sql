-- CRITICAL SECURITY FIX: Restrict student_courses table access to prevent email scraping
-- Issue: "Anyone can view student courses" policy exposes student_email to anonymous users

-- Drop the dangerously permissive public access policy
DROP POLICY IF EXISTS "Anyone can view student courses" ON public.student_courses;

-- Drop existing policies to recreate with proper authenticated role restrictions
DROP POLICY IF EXISTS "Students can manage their courses" ON public.student_courses;
DROP POLICY IF EXISTS "Users can add their own student courses" ON public.student_courses;
DROP POLICY IF EXISTS "Users can delete their own student courses" ON public.student_courses;

-- Explicitly revoke public access at table level
REVOKE ALL ON public.student_courses FROM anon;
REVOKE ALL ON public.student_courses FROM public;

-- Grant SELECT only to authenticated users (further restricted by RLS)
GRANT SELECT ON public.student_courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.student_courses TO authenticated;

-- Create secure RLS policies for authenticated users only

-- Students can view their own courses (including their email)
CREATE POLICY "Students can view their own courses"
ON public.student_courses
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Students can insert their own courses
CREATE POLICY "Students can insert their own courses"
ON public.student_courses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Students can update their own courses
CREATE POLICY "Students can update their own courses"
ON public.student_courses
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

-- Students can delete their own courses
CREATE POLICY "Students can delete their own courses"
ON public.student_courses
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);

-- Admins can view all student courses
CREATE POLICY "Admins can view all student courses"
ON public.student_courses
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all student courses
CREATE POLICY "Admins can manage all student courses"
ON public.student_courses
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add security comment
COMMENT ON TABLE public.student_courses IS 'CRITICAL SECURITY: Contains student PII (student_email). RLS enabled. Only authenticated students can view their own courses. Admins have full access. Anonymous users are completely blocked.';