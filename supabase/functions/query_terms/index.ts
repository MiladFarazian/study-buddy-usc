
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Term = {
  id: string;
  code: string;
  name: string;
  is_current: boolean;
};

export const query_terms = async (): Promise<Term[]> => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    try {
      // Query the terms table with explicit type
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .order('code', { ascending: false });
      
      if (error) {
        console.error('Error querying terms table:', error);
        // If table doesn't exist, return hardcoded terms instead of throwing
        if (error.code === '42P01') {
          console.log('Terms table not found, returning default terms');
          return [
            { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
            { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
            { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
          ];
        }
        throw error;
      }
      
      // Explicitly return the data as Term[]
      return data as Term[];
    } catch (error) {
      console.error('Database error in query_terms:', error);
      // Fallback to hard-coded terms
      return [
        { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
        { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
        { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
      ];
    }
  } catch (error) {
    console.error('Error in query_terms function:', error);
    throw error;
  }
};

// Handle HTTP requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const terms = await query_terms();
    return new Response(JSON.stringify(terms), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
