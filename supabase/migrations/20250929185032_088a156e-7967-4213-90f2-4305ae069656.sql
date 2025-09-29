-- Add RLS policy to allow tutors to view their assigned students' profiles
CREATE POLICY "Tutors can view their assigned students profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT student_id 
    FROM public.tutor_students 
    WHERE tutor_id = auth.uid() 
    AND active = true
  )
);