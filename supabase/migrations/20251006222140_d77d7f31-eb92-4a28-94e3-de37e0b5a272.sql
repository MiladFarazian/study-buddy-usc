-- Remove legacy duplicate trigger and ensure single, precise trigger
BEGIN;

-- Delete the older trigger that caused duplicate sends
DROP TRIGGER IF EXISTS on_tutor_approved ON public.profiles;

-- Ensure only one trigger exists with a strict condition
DROP TRIGGER IF EXISTS trg_notify_tutor_approval ON public.profiles;
CREATE TRIGGER trg_notify_tutor_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.approved_tutor = FALSE AND NEW.approved_tutor = TRUE)
  EXECUTE FUNCTION public.notify_tutor_approval();

COMMIT;