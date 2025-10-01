-- Add instructor column to tutor_courses table
ALTER TABLE public.tutor_courses 
ADD COLUMN IF NOT EXISTS instructor text;

-- Add instructor column to tutor_student_courses table
ALTER TABLE public.tutor_student_courses 
ADD COLUMN IF NOT EXISTS instructor text;

-- Add comment for documentation
COMMENT ON COLUMN public.tutor_courses.instructor IS 'Name of the instructor for this specific course section';
COMMENT ON COLUMN public.tutor_student_courses.instructor IS 'Name of the instructor for this specific course section';