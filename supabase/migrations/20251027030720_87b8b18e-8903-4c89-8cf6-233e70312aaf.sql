-- Update the handle_profile_role_change function to auto-approve tutors
-- This ensures tutors are visible on the Tutors page immediately when role is changed

CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If role changed to tutor, create tutor record with auto-approval
  IF NEW.role = 'tutor' AND (OLD.role IS NULL OR OLD.role != 'tutor') THEN
    INSERT INTO public.tutors (profile_id, bio, approved_tutor)
    VALUES (NEW.id, NEW.tutor_bio, true)
    ON CONFLICT (profile_id) 
    DO UPDATE SET approved_tutor = true, bio = EXCLUDED.bio;
  END IF;
  
  -- If role changed to student, create student record
  IF NEW.role = 'student' AND (OLD.role IS NULL OR OLD.role != 'student') THEN
    INSERT INTO public.students (profile_id, bio, courses, stripe_customer_id)
    VALUES (NEW.id, NEW.student_bio, NEW.student_courses, NEW.stripe_customer_id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;