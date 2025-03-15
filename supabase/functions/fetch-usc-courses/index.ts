
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { parse as parseCSV } from "https://deno.land/std@0.177.0/encoding/csv.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

// Helper function to retry API requests
async function fetchWithRetry(url: string, maxRetries = MAX_RETRIES): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      
      // If successful, return the response
      if (response.ok) {
        return response;
      }
      
      // If 404, don't retry but return the response
      if (response.status === 404) {
        console.log(`Resource not found at ${url}`);
        return response;
      }
      
      // For other errors, wait and retry
      lastError = new Error(`Request failed with status ${response.status}`);
      
    } catch (error) {
      lastError = error;
    }
    
    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  
  throw lastError;
}

// Helper function to safely parse a CSV file
async function safeParseCSV(text: string): Promise<any[]> {
  try {
    return await parseCSV(text, { skipFirstRow: true });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}

// Helper function to extract course description from USC website
async function fetchCourseDescription(courseCode: string, termCode: string): Promise<string | null> {
  try {
    const department = courseCode.split('-')[0].trim();
    const url = `https://classes.usc.edu/term-${termCode}/${department.toLowerCase()}/course/${courseCode}/`;
    
    const response = await fetchWithRetry(url);
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract description using a simple regex pattern
    const descriptionMatch = html.match(/<div class="catalogue-description">([\s\S]*?)<\/div>/);
    if (descriptionMatch && descriptionMatch[1]) {
      return descriptionMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
        .trim();
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching description for ${courseCode}:`, error);
    return null;
  }
}

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
    
    // Define USC schools with more complete list
    const schools = [
      'dornsife', 'marshall', 'viterbi', 'iovine-young', 'cinematic-arts',
      'price', 'annenberg', 'architecture', 'dramatic-arts', 'music',
      'roski', 'dent', 'chan', 'pharmacy', 'keck', 'law', 'leonard-davis',
      'thornton', 'rossier', 'bovard', 'independent-health', 'gero',
      'engemann', 'sca', 'engr', 'masc', 'gsba', 'acad', 'arr', 'mses'
    ];
    
    // Define alternate formatting of school names for more robust scraping
    const alternateSchoolNamesMap: Record<string, string[]> = {
      'cinematic-arts': ['cinema'],
      'rossier': ['education'],
      'chan': ['biokinesiology', 'physical-therapy'],
      'thornton': ['music'],
      'marshall': ['business', 'accounting', 'finance'],
      'dornsife': ['college', 'liberal-arts'],
      'viterbi': ['engineering'],
      'price': ['public-policy'],
      'keck': ['medicine', 'medical'],
      'dent': ['dentistry'],
      'law': ['gould'],
      'gero': ['gerontology'],
      'dramatic-arts': ['theatre']
    };
    
    // Process both standard and alternate school names
    const allSchoolVariations: string[] = [];
    schools.forEach(school => {
      allSchoolVariations.push(school);
      if (alternateSchoolNamesMap[school]) {
        allSchoolVariations.push(...alternateSchoolNamesMap[school]);
      }
    });
    
    const allCourses = [];
    let successCount = 0;
    let errorCount = 0;
    let totalCoursesFetched = 0;
    
    // Process each school
    for (const school of [...new Set(allSchoolVariations)]) {
      try {
        console.log(`Processing school: ${school}`);
        
        // Construct the URL for the CSV file
        const csvUrl = `https://classes.usc.edu/term-${term}/${school}/csv/`;
        
        console.log(`Fetching CSV from: ${csvUrl}`);
        
        // Fetch the CSV file with retry logic
        const response = await fetchWithRetry(csvUrl);
        
        if (!response.ok) {
          console.log(`Failed to fetch CSV for ${school}: ${response.status}`);
          continue;
        }
        
        // Parse the CSV data
        const csvText = await response.text();
        const rows = await safeParseCSV(csvText);
        
        if (!rows || rows.length === 0) {
          console.log(`No valid data in CSV for ${school}`);
          continue;
        }
        
        console.log(`Found ${rows.length} courses for ${school}`);
        totalCoursesFetched += rows.length;
        
        // Process each row in the CSV
        for (const row of rows) {
          // CSV format: number,title,units,type,days,time,location,instructor
          if (row.length < 8) {
            console.log(`Skipping incomplete row for ${school}:`, row);
            continue;
          }
          
          const [courseCode, name, units, type, days, time, location, instructor] = row;
          
          // Skip if no valid course code
          if (!courseCode) {
            console.log(`Skipping row with no course code for ${school}`);
            continue;
          }
          
          // Extract department code (e.g., CSCI from CSCI-102)
          const department = courseCode.split('-')[0].trim();
          
          // Remove duplicate spaces and trim
          const cleanName = name.replace(/\s+/g, ' ').trim();
          
          // Fetch course description if we don't have enough courses yet
          // Limiting to avoid rate limiting and long processing times
          let description = null;
          if (allCourses.length < 1000) {
            description = await fetchCourseDescription(courseCode, term);
          }
          
          const course = {
            code: courseCode,
            name: cleanName,
            department,
            description,
            term_code: term,
            instructor,
            units,
            session_type: type,
            days,
            time,
            location
          };
          
          allCourses.push(course);
        }
        
        // Add a delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`Error processing ${school}:`, err);
        errorCount++;
      }
    }
    
    // Exit early if no courses were found
    if (allCourses.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No courses found for the specified term",
          success: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found a total of ${allCourses.length} courses. Storing in database...`);
    
    // Store unique courses in Supabase based on course code and term
    const uniqueCourseMap = new Map();
    for (const course of allCourses) {
      const key = `${course.code}_${course.term_code}`;
      uniqueCourseMap.set(key, course);
    }
    
    const uniqueCourses = Array.from(uniqueCourseMap.values());
    console.log(`Storing ${uniqueCourses.length} unique courses...`);
    
    // Process courses in batches to avoid request size limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < uniqueCourses.length; i += BATCH_SIZE) {
      const batch = uniqueCourses.slice(i, i + BATCH_SIZE);
      
      try {
        // Use upsert to handle both insert and update
        const { data, error } = await supabase
          .from('courses')
          .upsert(
            batch,
            { 
              onConflict: 'code,term_code',
              ignoreDuplicates: false
            }
          );
        
        if (error) {
          console.error(`Error storing batch ${i}/${uniqueCourses.length}:`, error);
          errorCount += batch.length;
        } else {
          console.log(`Successfully stored batch ${i}/${uniqueCourses.length}`);
          successCount += batch.length;
        }
      } catch (error) {
        console.error(`Exception storing batch ${i}/${uniqueCourses.length}:`, error);
        errorCount += batch.length;
      }
      
      // Add a delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${successCount} USC courses for term ${term}. Processed ${totalCoursesFetched} courses from ${schools.length} schools. Errors: ${errorCount}.` 
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
