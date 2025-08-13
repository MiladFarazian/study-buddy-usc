-- Fix payment_transactions table security
-- Remove any existing public access policies and ensure proper RLS

-- First, let's make sure RLS is enabled
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies (if they exist)
DROP POLICY IF EXISTS "Public can view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payment_transactions;
DROP POLICY IF EXISTS "Anyone can view payment transactions" ON public.payment_transactions;

-- Create secure policies that only allow access to involved parties
-- Students can only view their own payment transactions
CREATE POLICY "Students can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = student_id);

-- Tutors can only view payment transactions for their sessions
CREATE POLICY "Tutors can view payment transactions for their sessions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = tutor_id);

-- Students can only insert their own payment transactions
CREATE POLICY "Students can insert their own payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Service role can manage all payment transactions (for edge functions)
CREATE POLICY "Service role can manage all payment transactions" 
ON public.payment_transactions 
FOR ALL 
USING (true);

-- Ensure no UPDATE or DELETE permissions for regular users
-- Only service role can update payment transactions
CREATE POLICY "Service role can update payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (true);

-- Prevent regular users from deleting payment transactions
-- Only service role should be able to delete if needed
CREATE POLICY "Service role can delete payment transactions" 
ON public.payment_transactions 
FOR DELETE 
USING (true);