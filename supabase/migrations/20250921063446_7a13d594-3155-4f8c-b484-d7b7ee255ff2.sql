-- Update sessions table to support three-state confirmation fields
-- Change student_confirmed from boolean to text with three states: pending, confirmed, no_show
ALTER TABLE sessions 
ALTER COLUMN student_confirmed TYPE TEXT 
USING CASE 
  WHEN student_confirmed = true THEN 'confirmed'
  WHEN student_confirmed = false THEN 'pending'
  ELSE 'pending'
END;

-- Also update tutor_confirmed for consistency
ALTER TABLE sessions 
ALTER COLUMN tutor_confirmed TYPE TEXT 
USING CASE 
  WHEN tutor_confirmed = true THEN 'confirmed'
  WHEN tutor_confirmed = false THEN 'pending'
  ELSE 'pending'
END;

-- Set default values for new columns
ALTER TABLE sessions 
ALTER COLUMN student_confirmed SET DEFAULT 'pending';

ALTER TABLE sessions 
ALTER COLUMN tutor_confirmed SET DEFAULT 'pending';

-- Add check constraints to ensure only valid values are allowed
ALTER TABLE sessions 
ADD CONSTRAINT student_confirmed_valid_values 
CHECK (student_confirmed IN ('pending', 'confirmed', 'no_show'));

ALTER TABLE sessions 
ADD CONSTRAINT tutor_confirmed_valid_values 
CHECK (tutor_confirmed IN ('pending', 'confirmed', 'no_show'));

-- Update any null values to 'pending'
UPDATE sessions 
SET student_confirmed = 'pending' 
WHERE student_confirmed IS NULL;

UPDATE sessions 
SET tutor_confirmed = 'pending' 
WHERE tutor_confirmed IS NULL;