-- Fix founding tutor badge and retroactively award badges to existing tutors (fixed version)

-- Update the existing database function to use the correct founding tutor date
CREATE OR REPLACE FUNCTION public.award_badges_for_tutor(input_tutor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
  SELECT * INTO bp FROM public.badge_progress WHERE tutor_id = input_tutor_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Precompute p95 rating among eligible tutors (>=10 sessions)
  SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY avg_rating)
  INTO p95_rating
  FROM public.badge_progress WHERE total_sessions >= 10;

  -- over_50_sessions
  IF bp.total_sessions >= 50 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''total_sessions'', $3, ''avg_rating'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'over_50_sessions', bp.total_sessions, bp.avg_rating;
  END IF;

  -- over_100_sessions
  IF bp.total_sessions >= 100 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''total_sessions'', $3, ''avg_rating'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'over_100_sessions', bp.total_sessions, bp.avg_rating;
  END IF;

  -- top_rated (>=4.5 and >=10 sessions)
  IF bp.avg_rating >= 4.5 AND bp.total_sessions >= 10 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_rating'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'top_rated', bp.avg_rating, bp.total_sessions;
  END IF;

  -- superstar (top 5% by rating among eligible)
  IF p95_rating IS NOT NULL AND bp.avg_rating >= p95_rating AND bp.total_sessions >= 10 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_rating'', $3, ''percentile_threshold'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'superstar', bp.avg_rating, p95_rating;
  END IF;

  -- student_success_champion (avg stress reduction >= 2.0 and >=15 sessions)
  IF (CASE WHEN bp.total_sessions > 0 THEN bp.total_stress_reduction / bp.total_sessions ELSE 0 END) >= 2.0 AND bp.total_sessions >= 15 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_stress_reduction'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'student_success_champion', (CASE WHEN bp.total_sessions > 0 THEN bp.total_stress_reduction / bp.total_sessions ELSE 0 END), bp.total_sessions;
  END IF;

  -- weekly_tutoring_streak (>=2 weeks)
  IF bp.current_streak_weeks >= 2 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''current_streak_weeks'', $3) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'weekly_tutoring_streak', bp.current_streak_weeks;
  END IF;

  -- quick_responder (<= 2h and >=20 sessions)
  IF bp.avg_response_time_hours > 0 AND bp.avg_response_time_hours <= 2 AND bp.total_sessions >= 20 THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''avg_response_time_hours'', $3, ''total_sessions'', $4) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'quick_responder', bp.avg_response_time_hours, bp.total_sessions;
  END IF;

  -- founding_tutor (signup before Oct 1, 2025 - which includes everyone right now)
  IF EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = input_tutor_id AND p.created_at < timestamp with time zone '2025-10-01T00:00:00Z'
  ) THEN
    EXECUTE format('INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met) 
      SELECT $1, $2::%s, jsonb_build_object(''created_at'', (SELECT created_at FROM public.profiles WHERE id = $1)) 
      WHERE NOT EXISTS (SELECT 1 FROM public.tutor_badges WHERE tutor_id = $1 AND badge_type = $2::%s)'
      , bt_type, bt_type)
    USING input_tutor_id, 'founding_tutor';
  END IF;

END;
$function$;

-- Create function to retroactively award badges to all existing tutors
CREATE OR REPLACE FUNCTION public.retroactive_badge_award()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  tutor_record RECORD;
BEGIN
  -- Loop through all tutors and award their badges
  FOR tutor_record IN 
    SELECT id FROM public.profiles WHERE role = 'tutor'
  LOOP
    PERFORM public.award_badges_for_tutor(tutor_record.id);
  END LOOP;
END;
$function$;

-- Execute the retroactive badge award
SELECT public.retroactive_badge_award();