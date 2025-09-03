-- Fix incorrect student IDs in sessions and payment transactions where student equals tutor
-- This addresses the issue where booking sessions as a logged-in user incorrectly used tutor ID as student ID

UPDATE public.sessions 
SET student_id = 'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'
WHERE id = 'f3d42e05-6469-4630-83d2-0ec7603182e4' 
  AND student_id = tutor_id
  AND tutor_id = '28991b01-ae2d-4d81-a5e1-80cae5535a59';

UPDATE public.payment_transactions 
SET student_id = 'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'
WHERE session_id = 'f3d42e05-6469-4630-83d2-0ec7603182e4' 
  AND student_id = tutor_id
  AND tutor_id = '28991b01-ae2d-4d81-a5e1-80cae5535a59';

UPDATE public.pending_transfers 
SET student_id = 'deabe8e0-ed86-4909-b05d-fa0b0801d5bd'
WHERE session_id = 'f3d42e05-6469-4630-83d2-0ec7603182e4' 
  AND student_id = tutor_id
  AND tutor_id = '28991b01-ae2d-4d81-a5e1-80cae5535a59';