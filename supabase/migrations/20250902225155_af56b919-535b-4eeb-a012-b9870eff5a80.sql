-- Add RLS policies for pending_transfers table

-- Allow service role to manage all transfers (for edge functions)
CREATE POLICY "Service role can manage all transfers" 
ON public.pending_transfers 
FOR ALL 
USING (true);

-- Allow tutors to view their own pending transfers
CREATE POLICY "Tutors can view their own pending transfers" 
ON public.pending_transfers 
FOR SELECT 
USING (auth.uid() = tutor_id);

-- Allow students to view pending transfers for their sessions
CREATE POLICY "Students can view their own pending transfers" 
ON public.pending_transfers 
FOR SELECT 
USING (auth.uid() = student_id);