-- Populate initial badge progress data
INSERT INTO public.badge_progress (tutor_id, total_sessions, avg_rating, current_streak_weeks)
SELECT 
  p.id,
  COALESCE(session_counts.total, 0),
  COALESCE(review_avgs.avg_rating, 0),
  0
FROM public.profiles p
LEFT JOIN (
  SELECT tutor_id, COUNT(*) as total
  FROM public.sessions 
  WHERE status = 'completed'
  GROUP BY tutor_id
) session_counts ON p.id = session_counts.tutor_id
LEFT JOIN (
  SELECT s.tutor_id, AVG(sr.teaching_quality) as avg_rating
  FROM public.sessions s
  JOIN public.student_reviews sr ON s.id = sr.session_id
  GROUP BY s.tutor_id
) review_avgs ON p.id = review_avgs.tutor_id
WHERE p.role = 'tutor'
ON CONFLICT (tutor_id) DO UPDATE SET
  total_sessions = EXCLUDED.total_sessions,
  avg_rating = EXCLUDED.avg_rating;

-- Award some test badges
INSERT INTO public.tutor_badges (tutor_id, badge_type, criteria_met)
SELECT p.id, 'founding_tutor'::public.badge_type, '{}'::jsonb
FROM public.profiles p
WHERE p.role = 'tutor' AND p.created_at < '2025-02-01'
ON CONFLICT (tutor_id, badge_type) DO NOTHING;