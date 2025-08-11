-- Add reminder sent timestamp columns to sessions for email scheduling
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;

ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;