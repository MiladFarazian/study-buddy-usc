-- Allow tutors to view profiles of students they've had completed sessions with
-- This fixes the My Students page where we fetch student profiles by IDs derived from sessions

-- Create a SELECT policy on profiles for tutors with completed sessions with the student
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Tutors can view profiles of students from their completed sessions'
  ) THEN
    CREATE POLICY "Tutors can view profiles of students from their completed sessions"
    ON public.profiles
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.student_id = profiles.id
          AND s.tutor_id = auth.uid()
          AND s.status = 'completed'::session_status
      )
    );
  END IF;
END $$;