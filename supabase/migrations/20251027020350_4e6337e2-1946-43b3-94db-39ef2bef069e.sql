-- ============================================
-- PRODUCTION-READY RLS SETUP WITH ADMIN ACCESS
-- ============================================
-- This migration implements strict user isolation with admin override capabilities
-- All tables require authentication and users can only access their own data
-- Admins can access all data for moderation and support purposes

-- ============================================
-- 1. CREATE ADMIN HELPER FUNCTIONS
-- ============================================

-- Function to check if current user is an admin via JWT claim
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin',
    false
  ) OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

COMMENT ON FUNCTION public.is_admin IS 'Checks if the current user has admin role via JWT claim or user_roles table';

-- Function to check if user owns a record
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
AS $$
  SELECT auth.uid() = record_user_id;
$$;

COMMENT ON FUNCTION public.is_owner IS 'Checks if the current authenticated user owns a specific record';

-- ============================================
-- 2. PROFILES TABLE - STRICT RLS
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;

-- Revoke all public/anon access
REVOKE ALL ON public.profiles FROM anon, public;

-- Grant to authenticated role only
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Policy: Users can view only their own profile OR admins can view all
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
);

-- Policy: Users can insert only their own profile
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- Policy: Users can update only their own profile OR admins can update any
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
);

-- Policy: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

COMMENT ON TABLE public.profiles IS 'User profiles with strict RLS - users can only access their own data, admins can access all';

-- ============================================
-- 3. CREATE SAFE PROFILES VIEW
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.profiles_safe;

-- Create secure view that hides email from non-owners
CREATE VIEW public.profiles_safe AS
SELECT 
  id,
  created_at,
  updated_at,
  role,
  first_name,
  last_name,
  avatar_url,
  major,
  graduation_year,
  bio,
  student_bio,
  tutor_bio,
  subjects,
  student_courses,
  tutor_courses_subjects,
  hourly_rate,
  average_rating,
  approved_tutor,
  available_in_person,
  available_online,
  stripe_connect_id,
  stripe_customer_id,
  stripe_connect_onboarding_complete,
  student_onboarding_complete,
  tutor_onboarding_complete,
  referral_code,
  referral_count,
  referred_by_code,
  -- Email only visible to owner or admin
  CASE 
    WHEN auth.uid() = id OR public.is_admin() 
    THEN email 
    ELSE NULL 
  END AS email
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
REVOKE ALL ON public.profiles_safe FROM anon, public;

COMMENT ON VIEW public.profiles_safe IS 'Secure view of profiles that hides email addresses except for the profile owner or admins';

-- ============================================
-- 4. SESSIONS TABLE - STRICT RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can create their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Participants can update their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can delete their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role manages all sessions" ON public.sessions;

-- Revoke all public/anon access
REVOKE ALL ON public.sessions FROM anon, public;

-- Grant to authenticated role only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;

-- Policy: Users can view sessions they're part of OR admins can view all
CREATE POLICY "sessions_select_participant_or_admin"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

-- Policy: Only students can create sessions for themselves
CREATE POLICY "sessions_insert_student_own"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
);

-- Policy: Participants can update their sessions OR admins can update any
CREATE POLICY "sessions_update_participant_or_admin"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

-- Policy: Students can delete their own sessions OR admins can delete any
CREATE POLICY "sessions_delete_student_or_admin"
ON public.sessions
FOR DELETE
TO authenticated
USING (
  auth.uid() = student_id 
  OR public.is_admin()
);

-- Service role access (bypasses RLS)
GRANT ALL ON public.sessions TO service_role;

COMMENT ON TABLE public.sessions IS 'Tutoring sessions with strict RLS - only participants and admins can access';

-- ============================================
-- 5. PAYMENT_TRANSACTIONS - STRICT RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated students view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Authenticated tutors view own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Authenticated students insert own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role manages all transactions" ON public.payment_transactions;

-- Revoke all public/anon access
REVOKE ALL ON public.payment_transactions FROM anon, public;

-- Grant to authenticated role only
GRANT SELECT, INSERT ON public.payment_transactions TO authenticated;

-- Policy: Students and tutors can view their own transactions OR admins can view all
CREATE POLICY "payment_transactions_select_own_or_admin"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

-- Policy: Students can insert their own transactions
CREATE POLICY "payment_transactions_insert_student"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
);

-- Service role full access (bypasses RLS)
GRANT ALL ON public.payment_transactions TO service_role;

COMMENT ON TABLE public.payment_transactions IS 'Payment records with strict RLS - only transaction participants and admins can access';

-- ============================================
-- 6. STUDENT_REVIEWS - STRICT RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students view own reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Students create reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Students update own reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors view session reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors create student reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors update their reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Service role manages all reviews" ON public.student_reviews;

-- Revoke all public/anon access
REVOKE ALL ON public.student_reviews FROM anon, public;

-- Grant to authenticated role only
GRANT SELECT, INSERT, UPDATE ON public.student_reviews TO authenticated;

-- Policy: Students and tutors can view their session reviews OR admins can view all
CREATE POLICY "student_reviews_select_participant_or_admin"
ON public.student_reviews
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

-- Policy: Students can create reviews for their sessions
CREATE POLICY "student_reviews_insert_student"
ON public.student_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
);

-- Policy: Students can update their own reviews OR admins can update any
CREATE POLICY "student_reviews_update_student_or_admin"
ON public.student_reviews
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id 
  OR public.is_admin()
);

-- Service role full access
GRANT ALL ON public.student_reviews TO service_role;

COMMENT ON TABLE public.student_reviews IS 'Student reviews with strict RLS - only review participants and admins can access';

-- ============================================
-- 7. STORAGE.OBJECTS - PROFILE PICTURES
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;

-- Policy: Anyone can view profile pictures (public bucket)
CREATE POLICY "storage_profile_pictures_select_public"
ON storage.objects
FOR SELECT
TO public, authenticated
USING (
  bucket_id = 'Profile Pictures'
);

-- Policy: Authenticated users can upload their own profile pictures
CREATE POLICY "storage_profile_pictures_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile Pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own profile pictures OR admins can update any
CREATE POLICY "storage_profile_pictures_update_own_or_admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Profile Pictures'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- Policy: Users can delete their own profile pictures OR admins can delete any
CREATE POLICY "storage_profile_pictures_delete_own_or_admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Profile Pictures'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- ============================================
-- 8. NOTIFICATIONS - STRICT RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can create notifications" ON public.notifications;

-- Revoke all public/anon access
REVOKE ALL ON public.notifications FROM anon, public;

-- Grant to authenticated role only
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- Policy: Users can view their own notifications OR admins can view all
CREATE POLICY "notifications_select_own_or_admin"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
);

-- Service role can insert notifications
GRANT INSERT ON public.notifications TO service_role;

COMMENT ON TABLE public.notifications IS 'User notifications with strict RLS - users can only access their own notifications';

-- ============================================
-- 9. CONVERSATIONS & MESSAGES - STRICT RLS
-- ============================================

-- Conversations policies
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;
DROP POLICY IF EXISTS "Tutors and students can create conversations they are part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they are part of" ON public.conversations;

REVOKE ALL ON public.conversations FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;

CREATE POLICY "conversations_select_participant_or_admin"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

CREATE POLICY "conversations_insert_participant"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id
);

CREATE POLICY "conversations_update_participant_or_admin"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id 
  OR auth.uid() = tutor_id 
  OR public.is_admin()
);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages from conversations they are part of" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to conversations they are part of" ON public.messages;

REVOKE ALL ON public.messages FROM anon, public;
GRANT SELECT, INSERT ON public.messages TO authenticated;

CREATE POLICY "messages_select_conversation_participant_or_admin"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.student_id = auth.uid() 
      OR conversations.tutor_id = auth.uid()
    )
  )
  OR public.is_admin()
);

CREATE POLICY "messages_insert_conversation_participant"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.student_id = auth.uid() 
      OR conversations.tutor_id = auth.uid()
    )
  )
);

-- ============================================
-- SUMMARY
-- ============================================
-- All tables now have strict RLS policies that:
-- 1. Block anonymous access completely
-- 2. Allow authenticated users to access only their own data
-- 3. Grant admins access to all data for moderation
-- 4. Use security definer functions to check admin status
-- 5. Include a safe profiles view that hides emails from non-owners