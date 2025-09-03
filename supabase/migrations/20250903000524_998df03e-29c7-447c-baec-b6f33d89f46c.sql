-- Delete invalid pending transfers where tutor and student are the same person
DELETE FROM public.pending_transfers 
WHERE student_id = tutor_id;