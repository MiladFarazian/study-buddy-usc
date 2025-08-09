-- Update badge progress with actual session and review data
INSERT INTO public.badge_progress (tutor_id, total_sessions, avg_rating, current_streak_weeks, total_stress_reduction, avg_response_time_hours)
SELECT 
  p.id as tutor_id,
  COALESCE(session_stats.session_count, 0) as total_sessions,
  COALESCE(review_stats.avg_rating, 0) as avg_rating,
  0 as current_streak_weeks,
  COALESCE(review_stats.total_stress_reduction, 0) as total_stress_reduction,
  2.5 as avg_response_time_hours
FROM public.profiles p
LEFT JOIN (
  SELECT 
    tutor_id,
    COUNT(*) as session_count
  FROM public.sessions 
  WHERE status = 'completed'
  GROUP BY tutor_id
) session_stats ON p.id = session_stats.tutor_id
LEFT JOIN (
  SELECT 
    s.tutor_id,
    AVG(sr.teaching_quality) as avg_rating,
    SUM(COALESCE(sr.stress_before - sr.stress_after, 0)) as total_stress_reduction
  FROM public.sessions s
  LEFT JOIN public.student_reviews sr ON s.id = sr.session_id
  GROUP BY s.tutor_id
) review_stats ON p.id = review_stats.tutor_id
WHERE p.role = 'tutor'
ON CONFLICT (tutor_id) DO UPDATE SET
  total_sessions = EXCLUDED.total_sessions,
  avg_rating = EXCLUDED.avg_rating,
  total_stress_reduction = EXCLUDED.total_stress_reduction,
  updated_at = now();