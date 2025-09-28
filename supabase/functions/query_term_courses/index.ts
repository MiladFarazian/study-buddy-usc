
// @ts-nocheck
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
    console.log('query_term_courses function called')
    
    const { term_code, legacy } = await req.json()
    console.log(`Requested term_code: ${term_code}, legacy: ${legacy}`)
    
    if (!term_code) {
      console.error('Missing term_code parameter')
      return new Response(
        JSON.stringify({ error: 'Missing term_code parameter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    console.log(`Connecting to Supabase at URL: ${supabaseUrl}`)
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey,
      { auth: { persistSession: false } }
    )

    // Special case for courses-XXXXX tables
    const tableName = `courses-${term_code}`
    console.log(`Checking direct courses table: ${tableName}`)
    
    try {
      const PAGE_SIZE = 1000;
      let allCourses: any[] = [];
      let page = 0;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        
        console.log(`Fetching page ${page} (rows ${from} to ${to})`);
        
        const { data, error, count } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact' })
          .range(from, to);
        
        if (error) {
          console.error(`Error fetching page ${page}:`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`Retrieved ${data.length} courses for page ${page}`);
          allCourses = [...allCourses, ...data];
          
          // Check if there might be more data
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`Total courses fetched: ${allCourses.length}`);
      
      if (allCourses.length > 0) {
        return new Response(
          JSON.stringify(allCourses),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (directQueryError) {
      console.warn(`Could not query ${tableName} directly:`, directQueryError)
      // Continue to legacy fallback if direct query fails
    }

    // Fallback to term tables RPC if direct query fails or returns no data
    console.log('Trying term_tables RPC fallback')
    const { data: termTables, error: termTablesError } = await supabaseAdmin.rpc('list_term_tables')
    
    if (termTablesError) {
      console.error('Error fetching term tables:', termTablesError)
      throw termTablesError
    }
    
    const termTable = termTables?.find((t: any) => t.term_code === term_code)
    
    if (!termTable) {
      console.warn(`Term table not found for term code: ${term_code}`)
      return new Response(
        JSON.stringify({ error: 'Term table not found', term_code }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log(`Found term table: ${termTable.table_name}`)
    
    // Execute SQL query to fetch from the schema.table
    const { data, error } = await supabaseAdmin.rpc(
      'list_term_courses',
      { term_table: termTable.table_name.split('.')[1] }
    )
    
    if (error) {
      console.error('Error fetching courses from RPC:', error)
      throw error
    }

    console.log(`Returning ${data?.length || 0} courses from RPC`)
    
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
