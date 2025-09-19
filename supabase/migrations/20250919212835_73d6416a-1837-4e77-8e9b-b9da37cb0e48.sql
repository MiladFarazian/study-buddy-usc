-- Add first_name and last_name columns to tutors table
ALTER TABLE tutors ADD COLUMN first_name VARCHAR(255);
ALTER TABLE tutors ADD COLUMN last_name VARCHAR(255);

-- Populate from profiles table
UPDATE tutors 
SET first_name = (SELECT first_name FROM profiles WHERE profiles.id = tutors.profile_id),
    last_name = (SELECT last_name FROM profiles WHERE profiles.id = tutors.profile_id);

-- Add index for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_tutors_names ON tutors (first_name, last_name);