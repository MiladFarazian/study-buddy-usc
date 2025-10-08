
-- Drop the existing view
DROP VIEW IF EXISTS public.platform_revenue;

-- Recreate the view with SECURITY INVOKER
-- This ensures the view respects RLS policies and runs with the permissions of the querying user
CREATE VIEW public.platform_revenue 
WITH (security_invoker = true)
AS 
SELECT 
  date(pending_transfers.created_at) AS date,
  count(*) FILTER (WHERE (pending_transfers.status = 'completed'::text)) AS transfer_count,
  sum(pending_transfers.platform_fee) FILTER (WHERE (pending_transfers.status = 'completed'::text)) AS daily_platform_revenue_cents,
  sum(pending_transfers.amount) FILTER (WHERE (pending_transfers.status = 'completed'::text)) AS daily_tutor_payouts_cents,
  round(((sum(pending_transfers.platform_fee) FILTER (WHERE (pending_transfers.status = 'completed'::text)))::numeric / 100.0), 2) AS daily_platform_revenue_dollars,
  round(((sum(pending_transfers.amount) FILTER (WHERE (pending_transfers.status = 'completed'::text)))::numeric / 100.0), 2) AS daily_tutor_payouts_dollars
FROM pending_transfers
GROUP BY date(pending_transfers.created_at);

-- Add comment explaining the security change
COMMENT ON VIEW public.platform_revenue IS 'Revenue aggregation view with SECURITY INVOKER to respect RLS policies of the querying user';
