-- Add student and tutor onboarding completion flags to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS student_onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tutor_onboarding_complete boolean DEFAULT false;

-- Set all existing approved tutors to need tutor onboarding
UPDATE public.profiles 
SET tutor_onboarding_complete = false 
WHERE approved_tutor = true;

-- Add helpful comment
COMMENT ON COLUMN public.profiles.student_onboarding_complete IS 'Tracks if student has completed onboarding documents';
COMMENT ON COLUMN public.profiles.tutor_onboarding_complete IS 'Tracks if tutor has completed onboarding documents';