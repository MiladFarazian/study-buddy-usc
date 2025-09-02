-- Delete all pending transfers except the last 14 records
DELETE FROM public.pending_transfers 
WHERE id NOT IN (
  SELECT id 
  FROM public.pending_transfers 
  ORDER BY created_at DESC 
  LIMIT 14
);