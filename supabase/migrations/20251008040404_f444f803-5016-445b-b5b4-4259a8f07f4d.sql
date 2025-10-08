-- Add profile_visibility column to tutors table (default: 'public')
ALTER TABLE public.tutors 
ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'public'
CHECK (profile_visibility IN ('public', 'course_match', 'hidden'));

-- Add max_weekly_sessions column to tutors table (nullable, no default)
ALTER TABLE public.tutors 
ADD COLUMN max_weekly_sessions INTEGER
CHECK (max_weekly_sessions IS NULL OR max_weekly_sessions > 0);

-- Drop existing policy
DROP POLICY IF EXISTS "Public can view approved tutors" ON public.tutors;

-- Create updated policy that respects visibility settings
CREATE POLICY "Public can view approved tutors with visibility" 
ON public.tutors 
FOR SELECT 
USING (
  approved_tutor = true 
  AND (
    profile_visibility = 'public'
    OR (
      profile_visibility = 'course_match' 
      AND EXISTS (
        SELECT 1 FROM public.student_courses sc
        JOIN public.tutor_courses tc ON sc.course_number = tc.course_number
        WHERE sc.student_id = auth.uid()
        AND tc.tutor_id = tutors.profile_id
      )
    )
  )
);

-- Allow existing students to view their tutors regardless of visibility
CREATE POLICY "Students can view their tutors regardless of visibility" 
ON public.tutors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sessions
    WHERE student_id = auth.uid() AND tutor_id = tutors.profile_id
  )
);