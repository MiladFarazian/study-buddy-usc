-- Create student_courses table (mirroring tutor_courses structure)
CREATE TABLE IF NOT EXISTS public.student_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_number TEXT NOT NULL,
  course_title TEXT,
  department TEXT,
  instructor TEXT,
  student_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_number, instructor)
);

-- Enable RLS
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirroring tutor_courses)
CREATE POLICY "Anyone can view student courses"
ON public.student_courses
FOR SELECT
USING (true);

CREATE POLICY "Users can add their own student courses"
ON public.student_courses
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can delete their own student courses"
ON public.student_courses
FOR DELETE
USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their courses"
ON public.student_courses
FOR ALL
USING (
  auth.uid() = student_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'::user_role
  )
);

-- Migrate existing student course data from profiles.student_courses array
INSERT INTO public.student_courses (student_id, course_number, student_email)
SELECT 
  p.id,
  unnest(p.student_courses) as course_number,
  p.email
FROM public.profiles p
WHERE p.role = 'student'::user_role
  AND p.student_courses IS NOT NULL
  AND array_length(p.student_courses, 1) > 0
ON CONFLICT (student_id, course_number, instructor) DO NOTHING;