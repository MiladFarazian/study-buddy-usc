
-- Enable REPLICA IDENTITY FULL for realtime on the notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the notifications table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
