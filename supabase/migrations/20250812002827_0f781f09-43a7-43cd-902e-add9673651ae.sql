-- Fix enum comparison in trigger function (remove invalid 'confirmed' status)
CREATE OR REPLACE FUNCTION public.update_response_time_on_session_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  avg_hours NUMERIC;
BEGIN
  -- Only consider valid enum values; previously referenced 'confirmed' which is not in the enum
  IF NEW.accepted_at IS NULL
     AND (NEW.status::text = 'scheduled')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Set accepted_at (separate UPDATE to avoid modifying NEW in AFTER trigger)
    UPDATE public.sessions SET accepted_at = now() WHERE id = NEW.id AND accepted_at IS NULL;
  END IF;

  -- Recompute average response time in hours for this tutor
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s.accepted_at - s.created_at))/3600), 0)
  INTO avg_hours
  FROM public.sessions s
  WHERE s.tutor_id = NEW.tutor_id AND s.accepted_at IS NOT NULL;

  UPDATE public.badge_progress
  SET avg_response_time_hours = COALESCE(avg_hours, 0), updated_at = now()
  WHERE tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$$;