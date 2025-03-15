
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { parse as parseCSV } from "https://deno.land/std@0.177.0/encoding/csv.ts";

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
    const { term } = await req.json();
    
    if (!term) {
      return new Response(
        JSON.stringify({ error: "Term code is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Fetching USC courses for term: ${term}`);
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // First check if the courses table has the term_code column
    try {
      const { data: hasTermCode, error: checkError } = await supabase.rpc(
        'check_column_exists',
        { 
          table_name: 'courses',
          column_name: 'term_code'
        }
      ).single();
      
      // If term_code column doesn't exist, add it
      if (checkError || hasTermCode === false) {
        console.log('Adding term_code column to courses table');
        
        // Add term_code column if it doesn't exist
        const { error: alterError } = await supabase.rpc(
          'execute_sql',
          { 
            sql: 'ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS term_code TEXT;'
          }
        );
        
        if (alterError) {
          console.error('Error adding term_code column:', alterError);
          // Continue anyway, the column might already exist
        }
      }
    } catch (err) {
      console.error('Error checking or adding term_code column:', err);
      // Continue anyway, the operation might succeed
    }

    // Define the USC class scraper function that uses CSV files
    async function scrapeUSCClasses(termCode: string) {
      console.log(`Starting to scrape USC classes for term ${termCode}`);
      
      // List of USC schools to fetch CSVs from
      const schools = [
        'dornsife', 'marshall', 'viterbi', 'iovine-young', 'cinematic-arts',
        'price', 'annenberg', 'architecture', 'dramatic-arts', 'music',
        'roski', 'dent', 'chan', 'pharmacy', 'keck', 'law', 'leonard-davis',
        'thornton', 'rossier', 'bovard', 'independent-health'
      ];
      
      const allCourses = [];
      
      for (const school of schools) {
        try {
          console.log(`Processing school: ${school}`);
          
          // Construct the URL for the CSV file
          const csvUrl = `https://classes.usc.edu/term-${termCode}/${school}/csv/`;
          
          console.log(`Fetching CSV from: ${csvUrl}`);
          // Fetch the CSV file
          const response = await fetch(csvUrl);
          
          if (!response.ok) {
            console.log(`Failed to fetch CSV for ${school}: ${response.status}`);
            continue;
          }
          
          // Parse the CSV data
          const csvText = await response.text();
          const rows = await parseCSV(csvText, { skipFirstRow: true });
          
          console.log(`Found ${rows.length} courses for ${school}`);
          
          // Process each row in the CSV
          for (const row of rows) {
            // CSV format: number,title,units,type,days,time,location,instructor
            if (row.length < 8) continue; // Ensure we have enough columns
            
            const [courseCode, name, units, type, days, time, location, instructor] = row;
            
            // Skip if no valid course code
            if (!courseCode) continue;
            
            // Extract department code (e.g., CSCI from CSCI-102)
            const department = courseCode.split('-')[0].trim();
            
            // Remove duplicate spaces and trim
            const cleanName = name.replace(/\s+/g, ' ').trim();
            
            allCourses.push({
              code: courseCode,
              name: cleanName,
              department,
              description: null, // CSV doesn't include descriptions
              term_code: termCode,
              instructor,
              units,
              session_type: type,
              days,
              time,
              location
            });
          }
          
          // Add a delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (err) {
          console.error(`Error processing ${school}:`, err);
        }
      }
      
      return allCourses;
    }

    // Scrape the USC classes
    const courses = await scrapeUSCClasses(term);
    
    if (courses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No courses found for the specified term" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found a total of ${courses.length} courses. Storing in database...`);
    
    // Store courses in Supabase
    let successCount = 0;
    let errorCount = 0;
    
    for (const course of courses) {
      try {
        // Check if the course already exists
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('code', course.code)
          .eq('term_code', course.term_code)
          .maybeSingle();
        
        if (existingCourse) {
          // Update existing course
          const { error } = await supabase
            .from('courses')
            .update(course)
            .eq('id', existingCourse.id);
            
          if (!error) successCount++;
          else errorCount++;
        } else {
          // Insert new course
          const { error } = await supabase
            .from('courses')
            .insert(course);
            
          if (!error) successCount++;
          else errorCount++;
        }
      } catch (error) {
        console.error(`Error storing course ${course.code}:`, error);
        errorCount++;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${successCount} USC courses for term ${term}. Errors: ${errorCount}.` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
