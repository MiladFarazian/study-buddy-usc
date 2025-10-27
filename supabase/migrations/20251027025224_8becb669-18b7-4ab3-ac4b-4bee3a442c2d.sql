-- Add trigger to automatically handle role changes on profiles table
-- This trigger will create tutor/student records when role changes

CREATE TRIGGER on_profile_role_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.handle_profile_role_change();