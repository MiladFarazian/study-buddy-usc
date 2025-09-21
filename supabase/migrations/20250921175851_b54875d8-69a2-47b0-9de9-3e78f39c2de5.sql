-- Revert sessions table confirmation fields back to boolean
-- Drop the check constraints first
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS student_confirmed_valid_values;

ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS tutor_confirmed_valid_values;

-- Drop existing defaults first
ALTER TABLE sessions 
ALTER COLUMN student_confirmed DROP DEFAULT;

ALTER TABLE sessions 
ALTER COLUMN tutor_confirmed DROP DEFAULT;

-- Convert text values back to boolean for student_confirmed
ALTER TABLE sessions 
ALTER COLUMN student_confirmed TYPE boolean 
USING CASE 
  WHEN student_confirmed = 'confirmed' THEN true
  WHEN student_confirmed = 'no_show' THEN true
  ELSE false
END;

-- Convert text values back to boolean for tutor_confirmed  
ALTER TABLE sessions 
ALTER COLUMN tutor_confirmed TYPE boolean 
USING CASE 
  WHEN tutor_confirmed = 'confirmed' THEN true
  WHEN tutor_confirmed = 'no_show' THEN true
  ELSE false
END;

-- Set default values back to false for both fields
ALTER TABLE sessions 
ALTER COLUMN student_confirmed SET DEFAULT false;

ALTER TABLE sessions 
ALTER COLUMN tutor_confirmed SET DEFAULT false;