-- Create a new completed test session for dev student account review testing
INSERT INTO public.sessions (
  tutor_id,
  student_id,
  start_time,
  end_time,
  status,
  session_type,
  payment_status,
  location,
  notes
) VALUES (
  '28991b01-ae2d-4d81-a5e1-80cae5535a59', -- Noah Sparks (tutor)
  'deabe8e0-ed86-4909-b05d-fa0b0801d5bd', -- BAT MAN (test student)
  '2024-01-15 14:00:00-08:00', -- Past start time (PST)
  '2024-01-15 15:00:00-08:00', -- Past end time (PST) 
  'completed', -- Status that allows reviews
  'online', -- Session type
  'paid', -- Payment status
  'Zoom', -- Location
  'Test session for review functionality'
);