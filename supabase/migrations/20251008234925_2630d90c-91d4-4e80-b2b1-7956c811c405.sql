
-- Enable RLS on backup tables
ALTER TABLE public.payment_transactions_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_transfers_backup ENABLE ROW LEVEL SECURITY;

-- Create service role only policies for payment_transactions_backup
-- This ensures only backend processes can access backup data
CREATE POLICY "Service role can manage payment_transactions_backup"
  ON public.payment_transactions_backup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create service role only policies for pending_transfers_backup
CREATE POLICY "Service role can manage pending_transfers_backup"
  ON public.pending_transfers_backup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments explaining these are backup tables with restricted access
COMMENT ON TABLE public.payment_transactions_backup IS 'Backup table for payment transactions - access restricted to service role only for data recovery purposes';
COMMENT ON TABLE public.pending_transfers_backup IS 'Backup table for pending transfers - access restricted to service role only for data recovery purposes';
