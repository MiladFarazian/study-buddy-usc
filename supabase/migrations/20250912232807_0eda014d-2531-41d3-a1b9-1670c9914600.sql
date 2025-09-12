-- Decouple badges from escrow: disable badge-related triggers on sessions
BEGIN;

-- Drop triggers that update badge progress and may award badges on session updates
DROP TRIGGER IF EXISTS trg_sessions_after_status_update ON public.sessions;
DROP TRIGGER IF EXISTS update_progress_after_session_completion ON public.sessions;

COMMIT;