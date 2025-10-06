-- Create trigger to send tutor approval email when approved_tutor is manually set to TRUE
-- Ensure any previous trigger is replaced safely
DROP TRIGGER IF EXISTS trg_notify_tutor_approval ON public.profiles;

CREATE TRIGGER trg_notify_tutor_approval
AFTER UPDATE OF approved_tutor ON public.profiles
FOR EACH ROW
WHEN (OLD.approved_tutor IS DISTINCT FROM NEW.approved_tutor)
EXECUTE FUNCTION public.notify_tutor_approval();