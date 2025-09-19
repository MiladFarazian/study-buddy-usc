-- DATABASE CLEANUP PHASE 1: Create separate tutors and students tables

-- Create tutor-specific table
CREATE TABLE public.tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hourly_rate NUMERIC,
  availability JSONB,
  subjects TEXT[],
  bio TEXT,
  average_rating NUMERIC,
  approved_tutor BOOLEAN DEFAULT FALSE,
  stripe_connect_id TEXT,
  stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Create student-specific table  
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  courses TEXT[],
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add indexes for performance
CREATE INDEX idx_tutors_profile_id ON public.tutors(profile_id);
CREATE INDEX idx_students_profile_id ON public.students(profile_id);
CREATE INDEX idx_tutors_approved ON public.tutors(approved_tutor);
CREATE INDEX idx_tutors_rating ON public.tutors(average_rating);
CREATE INDEX idx_students_courses ON public.students USING GIN(courses);

-- Enable RLS on new tables
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutors table
CREATE POLICY "Users can view their own tutor record" 
ON public.tutors 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own tutor record" 
ON public.tutors 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own tutor record" 
ON public.tutors 
FOR UPDATE 
USING (profile_id = auth.uid());

CREATE POLICY "Public can view approved tutors" 
ON public.tutors 
FOR SELECT 
USING (approved_tutor = true);

-- RLS Policies for students table
CREATE POLICY "Users can view their own student record" 
ON public.students 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own student record" 
ON public.students 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own student record" 
ON public.students 
FOR UPDATE 
USING (profile_id = auth.uid());

-- Migrate existing tutor data
INSERT INTO public.tutors (
  profile_id, hourly_rate, availability, subjects, bio, average_rating,
  approved_tutor, stripe_connect_id, stripe_connect_onboarding_complete,
  created_at, updated_at
)
SELECT 
  id, 
  hourly_rate, 
  availability, 
  subjects, 
  COALESCE(tutor_bio, bio), 
  average_rating, 
  COALESCE(approved_tutor, false),
  stripe_connect_id, 
  COALESCE(stripe_connect_onboarding_complete, false),
  created_at,
  updated_at
FROM public.profiles 
WHERE role = 'tutor';

-- Migrate existing student data
INSERT INTO public.students (
  profile_id, bio, courses, stripe_customer_id, created_at, updated_at
)
SELECT 
  id, 
  COALESCE(student_bio, bio), 
  student_courses, 
  stripe_customer_id,
  created_at,
  updated_at
FROM public.profiles 
WHERE role = 'student';

-- Add update triggers for timestamps
CREATE TRIGGER update_tutors_updated_at
BEFORE UPDATE ON public.tutors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create tutor/student records when profile role changes
CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to tutor, create tutor record
  IF NEW.role = 'tutor' AND (OLD.role IS NULL OR OLD.role != 'tutor') THEN
    INSERT INTO public.tutors (profile_id, bio, approved_tutor)
    VALUES (NEW.id, NEW.tutor_bio, COALESCE(NEW.approved_tutor, false))
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  -- If role changed to student, create student record
  IF NEW.role = 'student' AND (OLD.role IS NULL OR OLD.role != 'student') THEN
    INSERT INTO public.students (profile_id, bio, courses, stripe_customer_id)
    VALUES (NEW.id, NEW.student_bio, NEW.student_courses, NEW.stripe_customer_id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;