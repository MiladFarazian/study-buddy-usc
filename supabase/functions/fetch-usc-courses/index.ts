
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

    // Define the USC class scraper function
    async function scrapeUSCClasses(termCode: string) {
      console.log(`Starting to scrape USC classes for term ${termCode}`);
      
      // List of departments to scrape (simplified for example)
      const departments = [
        'csci', 'math', 'buad', 'econ', 'engr', 'psyc', 'comm', 'bisc'
      ];
      
      const allCourses = [];
      
      for (const dept of departments) {
        try {
          console.log(`Processing department: ${dept}`);
          
          // Construct the URL for the department page
          const deptUrl = `https://classes.usc.edu/term-${termCode}/classes/${dept}`;
          
          // Fetch the department page
          const response = await fetch(deptUrl);
          
          if (!response.ok) {
            console.log(`Failed to fetch ${dept}: ${response.status}`);
            continue;
          }
          
          const html = await response.text();
          
          // Basic parsing of the HTML to extract course info
          // In a production environment, use a proper HTML parser
          const courseBlocks = html.split('<div class="course-id">');
          
          // Skip the first element as it doesn't contain a course
          for (let i = 1; i < courseBlocks.length; i++) {
            const block = courseBlocks[i];
            
            // Extract course code
            const codeMatch = block.match(/([\w-]+)\s+<span/);
            const code = codeMatch ? `${dept.toUpperCase()} ${codeMatch[1]}` : '';
            
            // Extract course name
            const nameMatch = block.match(/<h3 class="course-title">(.*?)<\/h3>/);
            const name = nameMatch ? nameMatch[1].trim() : '';
            
            // Extract course description
            const descMatch = block.match(/<div class="catalogue-description">(.*?)<\/div>/s);
            let description = descMatch ? descMatch[1].trim() : '';
            
            // Clean up HTML tags from description
            description = description.replace(/<[^>]*>/g, '');
            
            if (code && name) {
              allCourses.push({
                code,
                name,
                description,
                department: dept.toUpperCase(),
                term_code: termCode
              });
            }
          }
          
          console.log(`Extracted ${allCourses.length} courses from ${dept}`);
          
          // Add a delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err) {
          console.error(`Error processing ${dept}:`, err);
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
    
    // Store courses in Supabase
    for (const course of courses) {
      // Check if the course already exists
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', course.code)
        .eq('term_code', course.term_code)
        .maybeSingle();
      
      if (existingCourse) {
        // Update existing course
        await supabase
          .from('courses')
          .update(course)
          .eq('id', existingCourse.id);
      } else {
        // Insert new course
        await supabase
          .from('courses')
          .insert(course);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${courses.length} USC courses for term ${term}` 
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
