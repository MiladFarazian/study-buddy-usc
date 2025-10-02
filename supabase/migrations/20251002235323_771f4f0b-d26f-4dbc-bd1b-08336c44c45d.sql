-- Add session type availability preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS available_in_person boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS available_online boolean DEFAULT true;

-- Add comment explaining the columns
COMMENT ON COLUMN public.profiles.available_in_person IS 'Indicates if tutor is available for in-person sessions';
COMMENT ON COLUMN public.profiles.available_online IS 'Indicates if tutor is available for online sessions';