-- Fix student mode vs tutor mode separation
-- CRITICAL: profiles.role should NOT auto-approve tutors
-- approved_tutor requires manual approval or application process

-- Update function to sync data WITHOUT auto-approving tutors
CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Role changed to tutor (but DO NOT auto-approve)
  IF NEW.role = 'tutor' AND (OLD.role IS DISTINCT FROM 'tutor') THEN
    -- Only sync to tutors table if already approved
    IF NEW.approved_tutor = TRUE THEN
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
      SET first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          bio = EXCLUDED.bio,
          hourly_rate = EXCLUDED.hourly_rate,
          updated_at = now();
    END IF;
  END IF;
  
  -- Role changed to student
  IF NEW.role = 'student' AND (OLD.role IS DISTINCT FROM 'student') THEN
    INSERT INTO public.students (profile_id, bio, courses, stripe_customer_id)
    VALUES (NEW.id, NEW.student_bio, NEW.student_courses, NEW.stripe_customer_id)
    ON CONFLICT (profile_id) DO UPDATE
    SET bio = EXCLUDED.bio,
        courses = EXCLUDED.courses,
        updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Revert any incorrect auto-approvals from previous migration
-- Only users who ALREADY had approved_tutor should keep it
UPDATE public.profiles
SET approved_tutor = FALSE
WHERE role = 'tutor'::user_role
  AND approved_tutor = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.tutors 
    WHERE tutors.profile_id = profiles.id 
    AND tutors.approved_tutor = TRUE
  );

COMMENT ON FUNCTION public.handle_profile_role_change() IS 
'Syncs profile data to tutors/students tables based on role.
IMPORTANT: Does NOT auto-approve tutors. approved_tutor requires separate approval process.
profiles.role = UI preference (student view vs tutor view)
profiles.approved_tutor = authorization flag (requires admin approval)';