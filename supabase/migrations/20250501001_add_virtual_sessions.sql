
-- Add virtual session support to sessions table
ALTER TABLE IF EXISTS public.sessions
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'in_person';

ALTER TABLE IF EXISTS public.sessions
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT DEFAULT NULL;

ALTER TABLE IF EXISTS public.sessions
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON public.sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_zoom_meeting_id ON public.sessions(zoom_meeting_id);
