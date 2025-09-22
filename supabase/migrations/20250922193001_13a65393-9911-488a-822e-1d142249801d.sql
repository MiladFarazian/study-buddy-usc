-- Add student and tutor name columns to sessions table for easier readability
ALTER TABLE public.sessions 
ADD COLUMN student_first_name text,
ADD COLUMN student_last_name text,
ADD COLUMN tutor_first_name text,
ADD COLUMN tutor_last_name text;

-- Create a function to automatically populate names when session is created/updated
CREATE OR REPLACE FUNCTION public.populate_session_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Get student names
  SELECT first_name, last_name 
  INTO NEW.student_first_name, NEW.student_last_name
  FROM public.profiles 
  WHERE id = NEW.student_id;
  
  -- Get tutor names
  SELECT first_name, last_name 
  INTO NEW.tutor_first_name, NEW.tutor_last_name
  FROM public.profiles 
  WHERE id = NEW.tutor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate names on insert
CREATE TRIGGER populate_session_names_on_insert
  BEFORE INSERT ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_session_names();

-- Create trigger to automatically populate names on update (if IDs change)
CREATE TRIGGER populate_session_names_on_update
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  WHEN (OLD.student_id IS DISTINCT FROM NEW.student_id OR OLD.tutor_id IS DISTINCT FROM NEW.tutor_id)
  EXECUTE FUNCTION public.populate_session_names();

-- Populate names for existing sessions
UPDATE public.sessions 
SET 
  student_first_name = sp.first_name,
  student_last_name = sp.last_name,
  tutor_first_name = tp.first_name,
  tutor_last_name = tp.last_name
FROM 
  public.profiles sp,
  public.profiles tp
WHERE 
  sessions.student_id = sp.id 
  AND sessions.tutor_id = tp.id;