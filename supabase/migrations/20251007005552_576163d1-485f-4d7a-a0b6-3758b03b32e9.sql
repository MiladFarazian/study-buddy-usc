-- Fix Jonah Ball's missing tutor record
INSERT INTO public.tutors (profile_id, bio, approved_tutor, hourly_rate, first_name, last_name)
VALUES (
  '181fed07-2329-466d-a4bd-1d9bccf96383',
  'need tutors',
  true,
  752.00,
  'Jonah',
  'Ball'
)
ON CONFLICT (profile_id) DO NOTHING;

-- Check for other profiles with same issue (approved tutors without tutor records)
-- This is just a diagnostic query to see the scope
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.profiles p
  WHERE p.approved_tutor = true
    AND NOT EXISTS (
      SELECT 1 FROM public.tutors t WHERE t.profile_id = p.id
    );
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % profiles with approved_tutor=true but missing tutor records', missing_count;
  END IF;
END $$;