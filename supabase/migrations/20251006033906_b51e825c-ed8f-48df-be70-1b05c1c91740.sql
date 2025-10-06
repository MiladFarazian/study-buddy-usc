-- Fix the notify_tutor_approval trigger to work with manual Supabase updates
-- Remove the problematic Authorization header access that doesn't exist in dashboard context

CREATE OR REPLACE FUNCTION public.notify_tutor_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tutor_email TEXT;
  tutor_name TEXT;
BEGIN
  -- Only proceed if approved_tutor changed from FALSE to TRUE
  IF OLD.approved_tutor = FALSE AND NEW.approved_tutor = TRUE THEN
    -- Get tutor's email and name
    tutor_email := NEW.email;
    tutor_name := COALESCE(NEW.first_name, 'Tutor');
    
    -- Call the edge function to send approval email
    -- No Authorization header needed since edge function has verify_jwt = false
    PERFORM net.http_post(
      url := 'https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/send-tutor-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'tutorEmail', tutor_email,
        'tutorName', tutor_name,
        'tutorId', NEW.id
      ),
      timeout_milliseconds := 5000
    );
    
    RAISE LOG 'Tutor approval email triggered for: %', tutor_email;
  END IF;
  
  RETURN NEW;
END;
$$;