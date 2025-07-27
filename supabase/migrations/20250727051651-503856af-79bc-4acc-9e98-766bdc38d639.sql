-- Create enum types for session status and completion method
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE completion_method AS ENUM ('auto', 'manual_both', 'manual_student', 'manual_tutor');

-- Add new columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN new_status session_status DEFAULT 'scheduled',
ADD COLUMN actual_start_time timestamp with time zone,
ADD COLUMN actual_end_time timestamp with time zone,
ADD COLUMN completion_method completion_method;

-- Copy existing status values to new column, mapping appropriately
UPDATE public.sessions 
SET new_status = CASE 
  WHEN status = 'pending' THEN 'scheduled'
  WHEN status = 'confirmed' THEN 'scheduled'
  WHEN status = 'cancelled' THEN 'cancelled'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'scheduled'
END;

-- Drop the old status column and rename the new one
ALTER TABLE public.sessions DROP COLUMN status;
ALTER TABLE public.sessions RENAME COLUMN new_status TO status;