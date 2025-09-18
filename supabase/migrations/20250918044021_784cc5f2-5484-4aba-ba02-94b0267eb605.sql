-- Phase 1: Add role-specific bio and course fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN student_bio TEXT,
ADD COLUMN tutor_bio TEXT,
ADD COLUMN student_courses TEXT[],
ADD COLUMN tutor_courses_subjects TEXT[];

-- Migrate existing data to both role-specific fields
UPDATE public.profiles 
SET student_bio = bio,
    tutor_bio = bio,
    student_courses = subjects,
    tutor_courses_subjects = subjects;