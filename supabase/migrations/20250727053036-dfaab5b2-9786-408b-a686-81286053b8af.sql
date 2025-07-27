-- Create enum for comfortable asking questions field
CREATE TYPE comfortable_asking_questions AS ENUM ('very', 'somewhat', 'not_at_all');

-- Create student_reviews table
CREATE TABLE public.student_reviews (
  review_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Show-up verification (critical for payment processing)
  tutor_showed_up BOOLEAN NOT NULL,
  
  -- Mental health metrics (1-10 scale for stress, 1-5 scale for others)
  stress_before INTEGER CHECK (stress_before >= 1 AND stress_before <= 10),
  stress_after INTEGER CHECK (stress_after >= 1 AND stress_after <= 10),
  confidence_improvement INTEGER CHECK (confidence_improvement >= 1 AND confidence_improvement <= 5),
  emotional_support INTEGER CHECK (emotional_support >= 1 AND emotional_support <= 5),
  learning_anxiety_reduction INTEGER CHECK (learning_anxiety_reduction >= 1 AND learning_anxiety_reduction <= 5),
  overall_wellbeing_impact INTEGER CHECK (overall_wellbeing_impact >= 1 AND overall_wellbeing_impact <= 5),
  
  -- Academic metrics (1-5 scale)
  teaching_quality INTEGER CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
  subject_clarity INTEGER CHECK (subject_clarity >= 1 AND subject_clarity <= 5),
  
  -- Other fields
  written_feedback TEXT,
  felt_judged BOOLEAN,
  comfortable_asking_questions comfortable_asking_questions,
  would_book_again BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students can insert their own reviews
CREATE POLICY "Students can create their own reviews" 
ON public.student_reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = student_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'student'
  )
);

-- Students can view their own reviews
CREATE POLICY "Students can view their own reviews" 
ON public.student_reviews 
FOR SELECT 
USING (auth.uid() = student_id);

-- Students can update their own reviews
CREATE POLICY "Students can update their own reviews" 
ON public.student_reviews 
FOR UPDATE 
USING (auth.uid() = student_id);

-- Tutors can view reviews about their sessions
CREATE POLICY "Tutors can view reviews about their sessions" 
ON public.student_reviews 
FOR SELECT 
USING (
  auth.uid() = tutor_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'tutor'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_student_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_reviews_updated_at
BEFORE UPDATE ON public.student_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_student_reviews_updated_at();

-- Add constraint to ensure only one review per session
ALTER TABLE public.student_reviews 
ADD CONSTRAINT unique_session_review UNIQUE (session_id);

-- Create validation trigger function for session consistency
CREATE OR REPLACE FUNCTION public.validate_student_review()
RETURNS TRIGGER AS $$
DECLARE
  session_student_id UUID;
  session_tutor_id UUID;
BEGIN
  -- Get the student_id and tutor_id from the session
  SELECT student_id, tutor_id INTO session_student_id, session_tutor_id
  FROM public.sessions 
  WHERE id = NEW.session_id;
  
  -- Check if session exists
  IF session_student_id IS NULL THEN
    RAISE EXCEPTION 'Session with id % does not exist', NEW.session_id;
  END IF;
  
  -- Validate student_id matches session
  IF NEW.student_id != session_student_id THEN
    RAISE EXCEPTION 'Student ID % does not match session student ID %', NEW.student_id, session_student_id;
  END IF;
  
  -- Validate tutor_id matches session
  IF NEW.tutor_id != session_tutor_id THEN
    RAISE EXCEPTION 'Tutor ID % does not match session tutor ID %', NEW.tutor_id, session_tutor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER validate_student_review_trigger
BEFORE INSERT OR UPDATE ON public.student_reviews
FOR EACH ROW
EXECUTE FUNCTION public.validate_student_review();