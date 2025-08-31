-- Add confirmation tracking columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN tutor_confirmed boolean DEFAULT false,
ADD COLUMN student_confirmed boolean DEFAULT false,
ADD COLUMN completion_date timestamp with time zone DEFAULT NULL;