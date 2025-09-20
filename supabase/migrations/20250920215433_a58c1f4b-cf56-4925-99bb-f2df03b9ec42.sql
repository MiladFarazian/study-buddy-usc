-- Phase 2: Remove redundant availability storage

-- Drop the tutor_availability table (no longer needed)
DROP TABLE IF EXISTS tutor_availability;

-- Remove availability column from profiles table (redundant)
ALTER TABLE profiles DROP COLUMN IF EXISTS availability;