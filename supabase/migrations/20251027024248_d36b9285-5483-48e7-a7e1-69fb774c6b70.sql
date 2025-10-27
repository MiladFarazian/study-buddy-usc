-- Update user 711e811f-ec21-4977-b98e-dd9fa0fa93b1 to tutor role
UPDATE public.profiles 
SET 
  role = 'tutor'::user_role,
  approved_tutor = true,
  hourly_rate = COALESCE(hourly_rate, 25.00),
  updated_at = now()
WHERE id = '711e811f-ec21-4977-b98e-dd9fa0fa93b1';

-- Ensure tutor record exists (trigger should handle this, but being explicit)
INSERT INTO public.tutors (profile_id, bio, approved_tutor, hourly_rate)
SELECT 
  '711e811f-ec21-4977-b98e-dd9fa0fa93b1',
  tutor_bio,
  true,
  COALESCE(hourly_rate, 25.00)
FROM public.profiles 
WHERE id = '711e811f-ec21-4977-b98e-dd9fa0fa93b1'
ON CONFLICT (profile_id) DO UPDATE 
SET 
  approved_tutor = true,
  hourly_rate = COALESCE(EXCLUDED.hourly_rate, tutors.hourly_rate, 25.00);