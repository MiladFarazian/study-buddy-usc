-- Fix security issues for profiles, payment_transactions, and platform_revenue (view)

-- ============================================
-- 1. FIX PROFILES TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Revoke all public access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant only to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Create secure policies for authenticated users only
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. FIX PAYMENT_TRANSACTIONS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Students can view their own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Tutors can view payment transactions for their sessions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Tutors can view payments for their sessions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Students can insert their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can manage all payment transactions" ON public.payment_transactions;

-- Revoke all public access
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.payment_transactions FROM public;

-- Grant only to authenticated users
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;

-- Create secure policies restricted to authenticated users
CREATE POLICY "Authenticated students view own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Authenticated tutors view own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = tutor_id);

CREATE POLICY "Authenticated students insert own transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Service role manages all transactions"
ON public.payment_transactions
FOR ALL
TO service_role
USING (true);

-- ============================================
-- 3. FIX PLATFORM_REVENUE VIEW (not a table, so no RLS)
-- ============================================
-- platform_revenue is a view, so we can only control access via GRANT/REVOKE
-- Revoke all public access
REVOKE ALL ON public.platform_revenue FROM anon;
REVOKE ALL ON public.platform_revenue FROM public;

-- Grant SELECT only to authenticated users (will be restricted by underlying table RLS)
GRANT SELECT ON public.platform_revenue TO authenticated;

-- Note: Access control for views relies on the RLS policies of underlying tables
-- Admins should use service_role or be granted explicit access via application logic

-- Add security comments
COMMENT ON TABLE public.profiles IS 'Contains PII including email addresses. Access restricted to authenticated users only - each user can only access their own profile. Admins have read access.';
COMMENT ON TABLE public.payment_transactions IS 'Contains sensitive financial data. Access restricted to authenticated users - students and tutors can only view their own transactions. Service role has full access for processing.';
COMMENT ON VIEW public.platform_revenue IS 'Contains business-critical revenue data. Access control relies on underlying table RLS policies. Only service_role and admin users should query this view.';
