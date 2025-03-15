
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

// Helper function to get USC term name from code
function getTermNameFromCode(termCode: string): string {
  const year = termCode.substring(0, 4);
  const term = termCode.substring(4);
  
  let termName = '';
  switch (term) {
    case '1':
      termName = 'Spring';
      break;
    case '2':
      termName = 'Summer';
      break;
    case '3':
      termName = 'Fall';
      break;
    default:
      termName = 'Unknown';
  }
  
  return `${termName} ${year}`;
}

// Function to create default terms in the database
async function createDefaultTerms(supabase: any): Promise<Term[]> {
  const currentYear = new Date().getFullYear();
  const terms: Term[] = [];
  
  // Create terms for current year and next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let term = 1; term <= 3; term++) {
      const termCode = `${year}${term}`;
      const termName = getTermNameFromCode(termCode);
      const isCurrentTerm = (year === currentYear && term === (new Date().getMonth() < 5 ? 1 : (new Date().getMonth() < 8 ? 2 : 3)));
      
      terms.push({
        id: crypto.randomUUID(),
        code: termCode,
        name: termName,
        is_current: isCurrentTerm
      });
    }
  }
  
  // Create terms in the database
  try {
    // Insert terms
    const { error } = await supabase
      .from('terms')
      .insert(terms);
    
    if (error) {
      console.error('Error creating default terms:', error);
    } else {
      console.log(`Created ${terms.length} default terms`);
    }
  } catch (error) {
    console.error('Error inserting terms:', error);
  }
  
  return terms;
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
    
    if (!termsTableExists) {
      console.log('Terms table not found, returning default terms');
      return [
        { id: '1', code: '20231', name: 'Spring 2023', is_current: false },
        { id: '2', code: '20232', name: 'Summer 2023', is_current: false },
        { id: '3', code: '20233', name: 'Fall 2023', is_current: true },
        { id: '4', code: '20241', name: 'Spring 2024', is_current: false },
        { id: '5', code: '20242', name: 'Summer 2024', is_current: false },
        { id: '6', code: '20243', name: 'Fall 2024', is_current: false }
      ];
    }
    
    // Query terms table
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('code', { ascending: false });
    
    if (error) {
      console.error('Error querying terms table:', error);
      throw error;
    }
    
    // If no terms found, create default terms
    if (!data || data.length === 0) {
      console.log('No terms found, creating default terms');
      return await createDefaultTerms(supabase);
    }
    
    return data as Term[];
    
  } catch (error) {
    console.error('Error in query_terms function:', error);
    // Final fallback
    return [
      { id: '1', code: '20231', name: 'Spring 2023', is_current: false },
      { id: '2', code: '20232', name: 'Summer 2023', is_current: false },
      { id: '3', code: '20233', name: 'Fall 2023', is_current: true },
      { id: '4', code: '20241', name: 'Spring 2024', is_current: false },
      { id: '5', code: '20242', name: 'Summer 2024', is_current: false },
      { id: '6', code: '20243', name: 'Fall 2024', is_current: false }
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
