-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION handle_dual_session_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when both confirmations are TRUE and not already completed
  -- Also check that at least one confirmation changed to TRUE in this update
  IF NEW.tutor_confirmed = TRUE 
     AND NEW.student_confirmed = TRUE 
     AND NEW.completion_date IS NULL 
     AND (OLD.tutor_confirmed IS DISTINCT FROM TRUE OR OLD.student_confirmed IS DISTINCT FROM TRUE)
  THEN
    -- Log the trigger execution for debugging
    RAISE LOG 'Dual confirmation trigger fired for session %', NEW.id;
    
    -- Call the escrow processing function via HTTP request
    -- Using pg_net to make async HTTP call to avoid blocking the transaction
    PERFORM net.http_post(
      url := 'https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/process-session-escrow',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('sessionId', NEW.id::text)::jsonb,
      timeout_milliseconds := 30000
    );
    
    RAISE LOG 'Escrow processing initiated for session %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Create the trigger on sessions table
CREATE TRIGGER trigger_dual_session_confirmation
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_dual_session_confirmation();