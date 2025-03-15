
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

// Helper function to check if a table exists
async function checkTableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    // Test with a simple query
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Helper function to check if a column exists
async function checkColumnExists(supabase: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    // This query will succeed if the column exists and fail if it doesn't
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}

export const query_terms = async (): Promise<Term[]> => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Check if terms table exists
    const termsTableExists = await checkTableExists(supabase, 'terms');
    
    // If terms table doesn't exist, return hardcoded terms
    if (!termsTableExists) {
      console.log('Terms table not found, returning default terms');
      return [
        { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
        { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
        { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
      ];
    }
    
    // Check if is_current column exists in terms table
    const isCurrentColumnExists = await checkColumnExists(supabase, 'terms', 'is_current');
    
    // Add is_current column if it doesn't exist
    if (!isCurrentColumnExists) {
      try {
        console.log('Adding is_current column to terms table');
        await supabase.rpc(
          'execute_sql',
          { sql: 'ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false' }
        );
      } catch (error) {
        console.error('Error adding is_current column:', error);
      }
    }
    
    // Query terms table
    try {
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .order('code', { ascending: false });
      
      if (error) {
        console.error('Error querying terms table:', error);
        throw error;
      }
      
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
    // Final fallback
    return [
      { id: '1', code: '20251', name: 'Spring 2025', is_current: true },
      { id: '2', code: '20252', name: 'Summer 2025', is_current: false },
      { id: '3', code: '20253', name: 'Fall 2025', is_current: false }
    ];
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
