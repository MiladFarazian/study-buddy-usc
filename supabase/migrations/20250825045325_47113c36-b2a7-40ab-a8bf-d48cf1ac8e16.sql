-- Add missing columns to student_reviews table for tutor review data
ALTER TABLE public.student_reviews 
ADD COLUMN IF NOT EXISTS student_showed_up boolean,
ADD COLUMN IF NOT EXISTS engagement_level integer,
ADD COLUMN IF NOT EXISTS came_prepared integer,
ADD COLUMN IF NOT EXISTS respectful integer,
ADD COLUMN IF NOT EXISTS motivation_effort integer,
ADD COLUMN IF NOT EXISTS tutor_feedback text;

-- Update RLS policies to allow tutors to insert reviews about their students
CREATE POLICY "Tutors can create reviews about their students" 
ON public.student_reviews 
FOR INSERT 
WITH CHECK (
  (auth.uid() = tutor_id) AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'tutor'::user_role
  ))
);

-- Create policy for tutors to update reviews they created
CREATE POLICY "Tutors can update reviews they created" 
ON public.student_reviews 
FOR UPDATE 
USING (
  (auth.uid() = tutor_id) AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'tutor'::user_role
  ))
);

-- Ensure triggers exist for badge progress updates
CREATE OR REPLACE FUNCTION public.update_badge_progress_after_tutor_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  t_id uuid;
  new_avg_rating NUMERIC;
  total_reduction NUMERIC;
  total_sessions_cnt INT;
BEGIN
  -- Get tutor id from the review
  t_id := NEW.tutor_id;
  
  IF t_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Recompute aggregates for the tutor when they submit reviews
  SELECT COALESCE(AVG(sr.teaching_quality), 0),
         COALESCE(SUM(sr.stress_before - sr.stress_after), 0),
         COALESCE(COUNT(DISTINCT s.id), 0)
  INTO new_avg_rating, total_reduction, total_sessions_cnt
  FROM public.student_reviews sr
  JOIN public.sessions s ON sr.session_id = s.id
  WHERE s.tutor_id = t_id AND sr.teaching_quality IS NOT NULL;

  -- Update badge progress
  INSERT INTO public.badge_progress (tutor_id, avg_rating, total_stress_reduction, total_sessions, updated_at)
  VALUES (t_id, COALESCE(new_avg_rating, 0), COALESCE(total_reduction, 0), COALESCE(total_sessions_cnt, 0), now())
  ON CONFLICT (tutor_id)
  DO UPDATE SET
    avg_rating = COALESCE(new_avg_rating, badge_progress.avg_rating),
    total_stress_reduction = COALESCE(total_reduction, badge_progress.total_stress_reduction),
    updated_at = now();

  -- Auto-award badges
  PERFORM public.award_badges_for_tutor(t_id);

  RETURN NEW;
END;
$function$;

-- Create trigger for tutor review submissions
DROP TRIGGER IF EXISTS update_badge_progress_after_tutor_review_trigger ON public.student_reviews;
CREATE TRIGGER update_badge_progress_after_tutor_review_trigger
  AFTER INSERT OR UPDATE ON public.student_reviews
  FOR EACH ROW
  WHEN (NEW.tutor_id IS NOT NULL AND NEW.tutor_feedback IS NOT NULL)
  EXECUTE FUNCTION public.update_badge_progress_after_tutor_review();