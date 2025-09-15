-- Add stripe_customer_id column to payment_transactions table
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for better performance when querying by customer ID
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_customer_id 
ON public.payment_transactions(stripe_customer_id);

-- Add index for better performance when querying by student_id for customer resolution
CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_id 
ON public.payment_transactions(student_id);