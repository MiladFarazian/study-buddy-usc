-- Create a trigger function to send email when tutor is approved
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
    PERFORM net.http_post(
      url := 'https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/send-tutor-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_tutor_approved ON public.profiles;
CREATE TRIGGER on_tutor_approved
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tutor_approval();