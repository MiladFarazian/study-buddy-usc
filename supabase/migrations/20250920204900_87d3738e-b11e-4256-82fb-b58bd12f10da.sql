-- Phase 1: Consolidate availability data to tutors.availability column

-- Step 1: Copy data from tutor_availability table to tutors.availability
UPDATE tutors 
SET availability = ta.availability, updated_at = now()
FROM tutor_availability ta
WHERE tutors.profile_id = ta.tutor_id 
AND ta.availability IS NOT NULL;

-- Step 2: Copy any newer data from profiles.availability if it exists and is more recent
UPDATE tutors 
SET availability = p.availability, updated_at = now()
FROM profiles p
WHERE tutors.profile_id = p.id 
AND p.availability IS NOT NULL
AND p.updated_at > tutors.updated_at;