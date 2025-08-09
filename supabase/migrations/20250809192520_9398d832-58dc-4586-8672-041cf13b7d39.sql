
-- 1) Add Zoom columns (idempotent)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS zoom_meeting_id text,
  ADD COLUMN IF NOT EXISTS zoom_join_url text,
  ADD COLUMN IF NOT EXISTS zoom_start_url text,
  ADD COLUMN IF NOT EXISTS zoom_password text,
  ADD COLUMN IF NOT EXISTS zoom_created_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS zoom_updated_at timestamp with time zone;

-- 2) Indexes for performance
CREATE INDEX IF NOT EXISTS sessions_zoom_meeting_id_idx ON public.sessions(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS sessions_zoom_created_at_idx ON public.sessions(zoom_created_at);

-- 3) Constraint: updated_at cannot be before created_at (allows NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_zoom_updated_after_created'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_zoom_updated_after_created
      CHECK (
        zoom_updated_at IS NULL
        OR zoom_created_at IS NULL
        OR zoom_updated_at >= zoom_created_at
      );
  END IF;
END
$$;

-- 4) Trigger function to manage zoom timestamps
CREATE OR REPLACE FUNCTION public.set_zoom_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.zoom_meeting_id IS NOT NULL
       OR NEW.zoom_join_url IS NOT NULL
       OR NEW.zoom_start_url IS NOT NULL
       OR NEW.zoom_password IS NOT NULL THEN
      IF NEW.zoom_created_at IS NULL THEN
        NEW.zoom_created_at := now();
      END IF;
      IF NEW.zoom_updated_at IS NULL THEN
        NEW.zoom_updated_at := NEW.zoom_created_at;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (COALESCE(NEW.zoom_meeting_id, '') IS DISTINCT FROM COALESCE(OLD.zoom_meeting_id, ''))
       OR (COALESCE(NEW.zoom_join_url, '') IS DISTINCT FROM COALESCE(OLD.zoom_join_url, ''))
       OR (COALESCE(NEW.zoom_start_url, '') IS DISTINCT FROM COALESCE(OLD.zoom_start_url, ''))
       OR (COALESCE(NEW.zoom_password, '') IS DISTINCT FROM COALESCE(OLD.zoom_password, '')) THEN
      NEW.zoom_updated_at := now();
      IF NEW.zoom_created_at IS NULL THEN
        NEW.zoom_created_at := now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 5) Attach trigger to sessions (fires on insert and when zoom fields change)
DROP TRIGGER IF EXISTS trg_sessions_zoom_timestamps ON public.sessions;

CREATE TRIGGER trg_sessions_zoom_timestamps
BEFORE INSERT OR UPDATE OF zoom_meeting_id, zoom_join_url, zoom_start_url, zoom_password
ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_zoom_timestamps();
