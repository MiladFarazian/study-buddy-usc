-- Fix security issues by setting proper search paths for functions

-- Update the validation function with proper search path
CREATE OR REPLACE FUNCTION public.validate_student_review()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Update the timestamp function with proper search path
CREATE OR REPLACE FUNCTION public.update_student_reviews_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;