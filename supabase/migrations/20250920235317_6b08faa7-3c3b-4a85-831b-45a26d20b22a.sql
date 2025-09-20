-- Clean up impossible time slots from existing tutor availability data
UPDATE public.tutors 
SET availability = (
  SELECT jsonb_object_agg(
    day_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'day', day_name,
          'start', slot_data->>'start',
          'end', slot_data->>'end'
        )
      ) FILTER (
        WHERE 
          -- Keep slots between 6:00 AM and 11:00 PM
          EXTRACT(HOUR FROM (slot_data->>'start')::time) >= 6 
          AND (
            EXTRACT(HOUR FROM (slot_data->>'end')::time) < 23 
            OR (
              EXTRACT(HOUR FROM (slot_data->>'end')::time) = 23 
              AND EXTRACT(MINUTE FROM (slot_data->>'end')::time) = 0
            )
          )
      ),
      '[]'::jsonb
    )
  )
  FROM (
    SELECT 
      day_name,
      jsonb_array_elements(day_slots) as slot_data
    FROM (
      SELECT 
        key as day_name,
        value as day_slots
      FROM jsonb_each(public.tutors.availability)
    ) as day_data
  ) as slot_data
  GROUP BY day_name
)
WHERE availability IS NOT NULL
AND EXISTS (
  SELECT 1 
  FROM jsonb_each(availability) as day_entry(day_name, day_slots)
  CROSS JOIN jsonb_array_elements(day_slots) as slot(slot_data)
  WHERE 
    EXTRACT(HOUR FROM (slot_data->>'start')::time) < 6 
    OR EXTRACT(HOUR FROM (slot_data->>'end')::time) > 23
    OR (
      EXTRACT(HOUR FROM (slot_data->>'end')::time) = 23 
      AND EXTRACT(MINUTE FROM (slot_data->>'end')::time) > 0
    )
);