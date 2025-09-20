-- Clean up impossible time slots from existing tutor availability data
-- First create a temporary function to filter availability
CREATE OR REPLACE FUNCTION filter_reasonable_hours(availability_data jsonb)
RETURNS jsonb AS $$
DECLARE
  day_name text;
  day_slots jsonb;
  slot jsonb;
  filtered_slots jsonb := '[]'::jsonb;
  result jsonb := '{}'::jsonb;
  start_time time;
  end_time time;
BEGIN
  -- Loop through each day
  FOR day_name, day_slots IN SELECT * FROM jsonb_each(availability_data)
  LOOP
    filtered_slots := '[]'::jsonb;
    
    -- Filter slots for this day
    FOR slot IN SELECT * FROM jsonb_array_elements(day_slots)
    LOOP
      start_time := (slot->>'start')::time;
      end_time := (slot->>'end')::time;
      
      -- Keep only slots between 6:00 AM and 11:00 PM
      IF EXTRACT(HOUR FROM start_time) >= 6 
         AND (EXTRACT(HOUR FROM end_time) < 23 
              OR (EXTRACT(HOUR FROM end_time) = 23 AND EXTRACT(MINUTE FROM end_time) = 0))
      THEN
        filtered_slots := filtered_slots || slot;
      END IF;
    END LOOP;
    
    result := result || jsonb_build_object(day_name, filtered_slots);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Now update the tutors table using the function
UPDATE public.tutors 
SET availability = filter_reasonable_hours(availability)
WHERE availability IS NOT NULL;

-- Drop the temporary function
DROP FUNCTION filter_reasonable_hours(jsonb);