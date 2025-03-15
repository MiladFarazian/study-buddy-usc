
// Create an RPC function to handle the query_terms call
// This is a workaround for the type errors with the terms table

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function query_terms() {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Query the terms table
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('code', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in query_terms function:', error);
    throw error;
  }
}
