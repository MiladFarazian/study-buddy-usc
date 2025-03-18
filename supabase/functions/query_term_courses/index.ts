
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

    // Special case for Fall 2025 term (code 20253)
    if (term_code === '20253') {
      console.log('Fetching courses from Fall 2025 table: courses-20253')
      
      const { data, error } = await supabaseAdmin
        .from('courses-20253')
        .select('*')
      
      if (error) {
        console.error('Error fetching courses:', error)
        throw error
      }

      // Process the data to add missing fields for Fall 2025
      const processedData = data.map((item: any) => {
        return {
          id: crypto.randomUUID(), // Generate a unique ID since it's missing
          "Course number": item["Course number"],
          "Course title": item["Course title"],
          Instructor: item.Instructor,
          department: item.department || 'Unknown' // Provide a default if missing
        }
      })

      return new Response(
        JSON.stringify(processedData || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For other terms, follow the original logic
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

    // Execute SQL query to fetch from the schema.table
    const { data, error } = await supabaseAdmin.rpc(
      'list_term_courses',
      { term_table: termTable.table_name.split('.')[1] }
    )
    
    if (error) {
      console.error('Error fetching courses:', error)
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
