-- Add accepted_at column to sessions if missing
DO $$
BEGIN
  IF NOT public.check_column_exists('sessions','accepted_at') THEN
    ALTER TABLE public.sessions ADD COLUMN accepted_at TIMESTAMPTZ NULL;
  END IF;
END$$;

-- Update progress after session status changes (with streaks)
CREATE OR REPLACE FUNCTION public.update_badge_progress_after_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  stress_reduction NUMERIC;
  new_avg_rating NUMERIC;
  prev_last_date DATE;
  new_date DATE := NEW.start_time::date;
  new_streak INT := 1;
BEGIN
  -- Only process when status becomes completed
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    -- Calculate stress reduction from student reviews for this session
    SELECT COALESCE(AVG(stress_before - stress_after), 0)
    INTO stress_reduction
    FROM public.student_reviews 
    WHERE session_id = NEW.id;

    -- Calculate new average rating for the tutor
    SELECT COALESCE(AVG(teaching_quality), 0)
    INTO new_avg_rating
    FROM public.student_reviews sr
    JOIN public.sessions s ON sr.session_id = s.id
    WHERE s.tutor_id = NEW.tutor_id;

    -- Determine streak
    SELECT last_session_date INTO prev_last_date
    FROM public.badge_progress WHERE tutor_id = NEW.tutor_id;

    IF prev_last_date IS NOT NULL THEN
      IF date_trunc('week', new_date)::date = date_trunc('week', prev_last_date)::date THEN
        -- same week, keep streak as-is (will set below)
        SELECT current_streak_weeks INTO new_streak FROM public.badge_progress WHERE tutor_id = NEW.tutor_id;
      ELSIF date_trunc('week', new_date)::date = (date_trunc('week', prev_last_date)::date + INTERVAL '1 week')::date THEN
        -- consecutive week
        SELECT COALESCE(current_streak_weeks, 0) + 1 INTO new_streak FROM public.badge_progress WHERE tutor_id = NEW.tutor_id;
      ELSE
        new_streak := 1;
      END IF;
    ELSE
      new_streak := 1;
    END IF;

    -- Upsert progress
    INSERT INTO public.badge_progress (tutor_id, total_sessions, last_session_date, avg_rating, total_stress_reduction, current_streak_weeks)
    VALUES (
      NEW.tutor_id, 
      1, 
      new_date,
      COALESCE(new_avg_rating, 0),
      COALESCE(stress_reduction, 0),
      1
    )
    ON CONFLICT (tutor_id) 
    DO UPDATE SET
      total_sessions = public.badge_progress.total_sessions + 1,
      last_session_date = new_date,
      avg_rating = COALESCE(new_avg_rating, public.badge_progress.avg_rating),
      total_stress_reduction = public.badge_progress.total_stress_reduction + COALESCE(stress_reduction, 0),
      current_streak_weeks = new_streak,
      updated_at = now();

    -- Attempt to award badges automatically
    PERFORM public.award_badges_for_tutor(NEW.tutor_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Maintain progress after reviews and award badges
CREATE OR REPLACE FUNCTION public.update_badge_progress_after_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  t_id uuid;
  new_avg_rating NUMERIC;
  total_reduction NUMERIC;
  total_sessions_cnt INT;
BEGIN
  -- Determine tutor id from session
  SELECT s.tutor_id INTO t_id FROM public.sessions s WHERE s.id = NEW.session_id;
  IF t_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Recompute aggregates for the tutor
  SELECT COALESCE(AVG(sr.teaching_quality), 0),
         COALESCE(SUM(sr.stress_before - sr.stress_after), 0),
         COALESCE(COUNT(DISTINCT s.id), 0)
  INTO new_avg_rating, total_reduction, total_sessions_cnt
  FROM public.student_reviews sr
  JOIN public.sessions s ON sr.session_id = s.id
  WHERE s.tutor_id = t_id;

  UPDATE public.badge_progress
  SET avg_rating = COALESCE(new_avg_rating, avg_rating),
      total_stress_reduction = COALESCE(total_reduction, total_stress_reduction),
      updated_at = now()
  WHERE tutor_id = t_id;

  -- Auto-award
  PERFORM public.award_badges_for_tutor(t_id);

  RETURN NEW;
END;
$$;

-- Track response time when a session is accepted (status changes to scheduled/confirmed)
CREATE OR REPLACE FUNCTION public.update_response_time_on_session_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  avg_hours NUMERIC;
BEGIN
  IF NEW.accepted_at IS NULL AND (NEW.status = 'scheduled' OR NEW.status = 'confirmed') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.accepted_at := now();
  END IF;

  -- Recompute average response time in hours for this tutor
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s.accepted_at - s.created_at))/3600), 0)
  INTO avg_hours
  FROM public.sessions s
  WHERE s.tutor_id = NEW.tutor_id AND s.accepted_at IS NOT NULL;

  UPDATE public.badge_progress
  SET avg_response_time_hours = COALESCE(avg_hours, 0), updated_at = now()
  WHERE tutor_id = NEW.tutor_id;

  RETURN NEW;
END;
$$;

-- Dynamic, safe badge awarding (works with enum badge_type)
CREATE OR REPLACE FUNCTION public.award_badges_for_tutor(tutor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  bt_type text; -- actual type name of tutor_badges.badge_type
  bp RECORD;
  p95_rating NUMERIC;
BEGIN
  -- Detect the enum type name for badge_type column
  SELECT atttypid::regtype::text INTO bt_type
  FROM pg_attribute 
  WHERE attrelid = 'public.tutor_badges'::regclass AND attname = 'badge_type';

  -- Load progress snapshot
  SELECT * INTO bp FROM public.badge_progress WHERE tutor_id = award_badges_for_tutor.tutor_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Precompute p95 rating among eligible tutors (>=10 sessions)
  SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY avg_rating)
  INTO p95_rating
  FROM public.badge_progress WHERE total_sessions >= 10;

  -- Helper to insert a badge if not exists
  PERFORM 1;
  -- over_50_sessions
  IF bp.total_sessions >= 50 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''total_sessions'', $3, ''avg_rating'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'over_50_sessions', bp.total_sessions, bp.avg_rating;
  END IF;

  -- over_100_sessions
  IF bp.total_sessions >= 100 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''total_sessions'', $3, ''avg_rating'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'over_100_sessions', bp.total_sessions, bp.avg_rating;
  END IF;

  -- top_rated (>=4.5 and >=10 sessions)
  IF bp.avg_rating >= 4.5 AND bp.total_sessions >= 10 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_rating'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'top_rated', bp.avg_rating, bp.total_sessions;
  END IF;

  -- superstar (top 5% by rating among eligible)
  IF p95_rating IS NOT NULL AND bp.avg_rating >= p95_rating AND bp.total_sessions >= 10 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_rating'', $3, ''percentile_threshold'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'superstar', bp.avg_rating, p95_rating;
  END IF;

  -- student_success_champion (avg stress reduction >= 2.0 and >=15 sessions)
  IF (CASE WHEN bp.total_sessions > 0 THEN bp.total_stress_reduction / bp.total_sessions ELSE 0 END) >= 2.0 AND bp.total_sessions >= 15 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_stress_reduction'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'student_success_champion', (CASE WHEN bp.total_sessions > 0 THEN bp.total_stress_reduction / bp.total_sessions ELSE 0 END), bp.total_sessions;
  END IF;

  -- weekly_tutoring_streak (>=2 weeks)
  IF bp.current_streak_weeks >= 2 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''current_streak_weeks'', $3) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'weekly_tutoring_streak', bp.current_streak_weeks;
  END IF;

  -- quick_responder (<= 2h and >=20 sessions)
  IF bp.avg_response_time_hours > 0 AND bp.avg_response_time_hours <= 2 AND bp.total_sessions >= 20 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_response_time_hours'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'quick_responder', bp.avg_response_time_hours, bp.total_sessions;
  END IF;

  -- founding_tutor (signup before cutoff)
  IF EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = tutor_id AND p.created_at < timestamp with time zone '2025-01-15T00:00:00Z'
  ) THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''created_at'', (SELECT created_at FROM public.profiles WHERE id = $1)) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING tutor_id, 'founding_tutor';
  END IF;

END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_sessions_after_status_update ON public.sessions;
CREATE TRIGGER trg_sessions_after_status_update
AFTER UPDATE OF status ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_badge_progress_after_session();

DROP TRIGGER IF EXISTS trg_sessions_response_time ON public.sessions;
CREATE TRIGGER trg_sessions_response_time
AFTER UPDATE OF status ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_response_time_on_session_update();

DROP TRIGGER IF EXISTS trg_student_reviews_after_save ON public.student_reviews;
CREATE TRIGGER trg_student_reviews_after_save
AFTER INSERT OR UPDATE ON public.student_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_badge_progress_after_review();
