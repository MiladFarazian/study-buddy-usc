
-- Function to list courses from a term-specific table
CREATE OR REPLACE FUNCTION public.list_term_courses(term_table TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query TEXT;
  result JSONB;
BEGIN
  -- Construct the query dynamically
  query := format('SELECT * FROM terms.%I', term_table);
  
  -- Execute the query and return the results
  FOR result IN EXECUTE query
  LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$;
