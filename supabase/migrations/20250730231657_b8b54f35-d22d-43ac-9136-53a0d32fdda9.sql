-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_tutor_badge_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role = 'tutor' AND OLD.role IS DISTINCT FROM 'tutor' THEN
    INSERT INTO public.badge_progress (tutor_id)
    VALUES (NEW.id)
    ON CONFLICT (tutor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_badge_progress_after_session()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  stress_reduction NUMERIC;
  new_avg_rating NUMERIC;
BEGIN
  -- Only process completed sessions
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Calculate stress reduction from student reviews
    SELECT COALESCE(AVG(stress_before - stress_after), 0)
    INTO stress_reduction
    FROM public.student_reviews 
    WHERE session_id = NEW.id;
    
    -- Calculate new average rating
    SELECT COALESCE(AVG(teaching_quality), 0)
    INTO new_avg_rating
    FROM public.student_reviews sr
    JOIN public.sessions s ON sr.session_id = s.id
    WHERE s.tutor_id = NEW.tutor_id;
    
    -- Update badge progress
    INSERT INTO public.badge_progress (tutor_id, total_sessions, last_session_date, avg_rating, total_stress_reduction)
    VALUES (
      NEW.tutor_id, 
      1, 
      NEW.start_time::date,
      new_avg_rating,
      stress_reduction
    )
    ON CONFLICT (tutor_id) 
    DO UPDATE SET
      total_sessions = public.badge_progress.total_sessions + 1,
      last_session_date = NEW.start_time::date,
      avg_rating = new_avg_rating,
      total_stress_reduction = public.badge_progress.total_stress_reduction + stress_reduction,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;