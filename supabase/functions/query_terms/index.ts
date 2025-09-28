
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Querying terms...');
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Query existing terms from database
    const { data: existingTerms, error: queryError } = await supabase
      .from('terms')
      .select('*')
      .order('code', { ascending: false });
      
    if (queryError) {
      console.error('Error querying terms:', queryError);
      throw queryError;
    }
    
    // If we already have terms in the database, update to ensure Spring 2025 is current
    if (existingTerms && existingTerms.length > 0) {
      console.log(`Found ${existingTerms.length} existing terms`);
      
      // Update all terms to set is_current to false
      await supabase
        .from('terms')
        .update({ is_current: false })
        .neq('id', '0'); // This will update all terms
      
      // Then set Spring 2025 as current
      await supabase
        .from('terms')
        .update({ is_current: true })
        .eq('code', '20251');
      
      // Query the updated terms
      const { data: updatedTerms, error: updateError } = await supabase
        .from('terms')
        .select('*')
        .order('code', { ascending: false });
        
      if (updateError) {
        console.error('Error querying updated terms:', updateError);
        throw updateError;
      }
      
      return new Response(
        JSON.stringify(updatedTerms || existingTerms),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // No terms found, let's create some default ones
    console.log('No existing terms found, creating default terms');
    
    // Generate default terms for current and upcoming semesters
    const defaultTerms = generateDefaultTerms();
    
    // Insert default terms
    const { data: insertedTerms, error: insertError } = await supabase
      .from('terms')
      .insert(defaultTerms)
      .select();
      
    if (insertError) {
      console.error('Error inserting default terms:', insertError);
      throw insertError;
    }
    
    console.log(`Created ${defaultTerms.length} default terms`);
    
    return new Response(
      JSON.stringify(insertedTerms || defaultTerms),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function generateDefaultTerms() {
  // Define default terms with Spring 2025 as current
  return [
    { code: '20251', name: 'Spring 2025', is_current: true },
    { code: '20252', name: 'Summer 2025', is_current: false },
    { code: '20253', name: 'Fall 2025', is_current: false }
  ];
}
