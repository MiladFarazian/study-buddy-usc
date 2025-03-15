
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
    
    // If we already have terms in the database, return them
    if (existingTerms && existingTerms.length > 0) {
      console.log(`Found ${existingTerms.length} existing terms`);
      return new Response(
        JSON.stringify(existingTerms),
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-indexed to 1-indexed
  
  // Determine current term season based on month
  let currentSeason;
  if (currentMonth >= 1 && currentMonth <= 5) {
    currentSeason = 1; // Spring (Jan-May)
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    currentSeason = 2; // Summer (Jun-Aug)
  } else {
    currentSeason = 3; // Fall (Sep-Dec)
  }
  
  // Generate terms for current year and next year
  const terms = [];
  const years = [currentYear, currentYear + 1];
  
  for (const year of years) {
    for (let season = 1; season <= 3; season++) {
      const isCurrent = (year === currentYear && season === currentSeason);
      const termCode = `${year}${season}`;
      const seasonName = season === 1 ? 'Spring' : season === 2 ? 'Summer' : 'Fall';
      
      terms.push({
        code: termCode,
        name: `${seasonName} ${year}`,
        is_current: isCurrent
      });
    }
  }
  
  // Sort by code in descending order (newest first)
  return terms.sort((a, b) => b.code.localeCompare(a.code));
}
