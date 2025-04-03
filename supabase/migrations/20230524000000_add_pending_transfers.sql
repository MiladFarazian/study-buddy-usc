
-- Create pending_transfers table to track tutor payments pending Connect onboarding
CREATE TABLE IF NOT EXISTS public.pending_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) NOT NULL,
  session_id UUID REFERENCES public.sessions(id) NOT NULL,
  tutor_id UUID REFERENCES public.profiles(id) NOT NULL,
  student_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  transfer_id TEXT,
  transfer_group TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payment_transaction_id)
);

-- Update payment_transactions table to track two-stage payments
ALTER TABLE IF EXISTS public.payment_transactions 
  ADD COLUMN IF NOT EXISTS requires_transfer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'connect_direct';

-- Add RLS policies
ALTER TABLE public.pending_transfers ENABLE ROW LEVEL SECURITY;

-- Admin can see all pending transfers
CREATE POLICY "Admins can manage pending transfers" 
  ON public.pending_transfers
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Tutors can see their own pending transfers
CREATE POLICY "Tutors can view their pending transfers" 
  ON public.pending_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Students can see their own pending transfers
CREATE POLICY "Students can view their pending transfers"
  ON public.pending_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
