-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to run transfer processing daily at 4 PM UTC (9 AM PST)
SELECT cron.schedule(
  'process-transfers-daily',
  '0 16 * * *', -- 4 PM UTC = 9 AM PST
  $$SELECT net.http_post(
    url:='https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/process-pending-transfers-batch',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );$$
);