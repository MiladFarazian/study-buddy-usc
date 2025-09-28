-- Drop ALL existing policies on sessions table to start clean
DROP POLICY IF EXISTS "Users can view sessions they are part of" ON public.sessions;
DROP POLICY IF EXISTS "Students can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update sessions they are part of" ON public.sessions;
DROP POLICY IF EXISTS "Students can delete their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admin can read all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Participants can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Students can view their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Tutors can update their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Tutors can view their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create their own sessions as students" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete sessions they created" ON public.sessions;
DROP POLICY IF EXISTS "Users can update sessions they are part of" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON public.sessions;

-- Create the correct policies for sessions
CREATE POLICY "Users can view their own sessions" 
ON public.sessions 
FOR SELECT 
USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can create their sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update their sessions" 
ON public.sessions 
FOR UPDATE 
USING (auth.uid() = student_id OR auth.uid() = tutor_id);

CREATE POLICY "Students can delete their sessions" 
ON public.sessions 
FOR DELETE 
USING (auth.uid() = student_id);

-- Service role access for admin functionality
CREATE POLICY "Service role manages all sessions" 
ON public.sessions 
FOR ALL 
USING (true);

-- Drop ALL existing policies on student_reviews table to start clean
DROP POLICY IF EXISTS "Students can view their own reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors can view reviews about their sessions" ON public.student_reviews;
DROP POLICY IF EXISTS "Students can create reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors can create reviews about their students" ON public.student_reviews;
DROP POLICY IF EXISTS "Students can update their own reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors can update reviews they created" ON public.student_reviews;
DROP POLICY IF EXISTS "Admin can read all student reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Admins can view all student reviews" ON public.student_reviews;
DROP POLICY IF EXISTS "Session participants can create reviews as students" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors can create reviews about their students" ON public.student_reviews;
DROP POLICY IF EXISTS "Tutors can update reviews they created" ON public.student_reviews;
DROP POLICY IF EXISTS "Service role can manage all student reviews" ON public.student_reviews;

-- Create the correct policies for student_reviews
CREATE POLICY "Students view own reviews" 
ON public.student_reviews 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Tutors view session reviews" 
ON public.student_reviews 
FOR SELECT 
USING (auth.uid() = tutor_id);

CREATE POLICY "Students create reviews" 
ON public.student_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors create student reviews" 
ON public.student_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = tutor_id);

CREATE POLICY "Students update own reviews" 
ON public.student_reviews 
FOR UPDATE 
USING (auth.uid() = student_id);

CREATE POLICY "Tutors update their reviews" 
ON public.student_reviews 
FOR UPDATE 
USING (auth.uid() = tutor_id);

-- Service role access for admin functionality
CREATE POLICY "Service role manages all reviews" 
ON public.student_reviews 
FOR ALL 
USING (true);