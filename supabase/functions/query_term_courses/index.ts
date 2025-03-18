
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { term_code } = await req.json()
    
    if (!term_code) {
      return new Response(
        JSON.stringify({ error: 'Missing term_code parameter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // First get the term table mapping
    const { data: termTables, error: termTablesError } = await supabaseAdmin.rpc('list_term_tables')
    
    if (termTablesError) {
      console.error('Error fetching term tables:', termTablesError)
      throw termTablesError
    }
    
    const termTable = termTables?.find((t: any) => t.term_code === term_code)
    
    if (!termTable) {
      return new Response(
        JSON.stringify({ error: 'Term table not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Execute direct SQL query to fetch from the schema.table
    const { data, error } = await supabaseAdmin.rpc(
      'execute_sql',
      { sql: `SELECT * FROM ${termTable.table_name}` }
    )
    
    if (error) {
      console.error('Error executing SQL:', error)
      throw error
    }

    return new Response(
      JSON.stringify(data || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
