-- Update the handle_profile_role_change function to auto-approve tutors
-- This ensures tutors are visible on the Tutors page immediately when role is changed
-- CRITICAL: Also updates profiles.approved_tutor to enable tutor mode in Settings UI

CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Role changed to tutor
  IF NEW.role = 'tutor' AND (OLD.role IS DISTINCT FROM 'tutor') THEN
    -- Update profiles.approved_tutor to enable tutor mode/UI and views
    UPDATE public.profiles
    SET approved_tutor = TRUE
    WHERE id = NEW.id AND (approved_tutor IS DISTINCT FROM TRUE);

    -- Upsert tutors row
    INSERT INTO public.tutors (profile_id, first_name, last_name, bio, hourly_rate, approved_tutor)
    VALUES (
      NEW.id,
      NEW.first_name,
      NEW.last_name,
      NEW.tutor_bio,
      NEW.hourly_rate,
      TRUE
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET approved_tutor = TRUE,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        bio = EXCLUDED.bio,
        hourly_rate = EXCLUDED.hourly_rate;
  END IF;
  
  -- Role changed to student (de-approve tutor status)
  IF NEW.role = 'student' AND (OLD.role IS DISTINCT FROM 'student') THEN
    UPDATE public.profiles
    SET approved_tutor = FALSE
    WHERE id = NEW.id AND (approved_tutor IS DISTINCT FROM FALSE);
    
    INSERT INTO public.students (profile_id, bio, courses, stripe_customer_id)
    VALUES (NEW.id, NEW.student_bio, NEW.student_courses, NEW.stripe_customer_id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Backfill: Approve all existing profiles marked as tutor
UPDATE public.profiles
SET approved_tutor = TRUE
WHERE role = 'tutor'::user_role
  AND (approved_tutor IS DISTINCT FROM TRUE);

-- Backfill: Ensure tutors table has a row for every approved tutor
INSERT INTO public.tutors (profile_id, first_name, last_name, bio, hourly_rate, approved_tutor)
SELECT
  p.id,
  p.first_name,
  p.last_name,
  COALESCE(p.tutor_bio, p.bio),
  p.hourly_rate,
  TRUE
FROM public.profiles p
WHERE p.role = 'tutor'::user_role
  AND p.approved_tutor = TRUE
ON CONFLICT (profile_id) DO UPDATE
SET approved_tutor = TRUE,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    bio = EXCLUDED.bio,
    hourly_rate = EXCLUDED.hourly_rate;