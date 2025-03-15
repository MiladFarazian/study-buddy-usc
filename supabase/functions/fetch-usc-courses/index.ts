
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
      console.log(`Attempt ${i+1}: Fetching ${url}`);
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
      console.log(`Error fetching ${url}: ${response.status}. Retrying...`);
    } catch (error) {
      lastError = error;
      console.log(`Exception fetching ${url}: ${error.message}. Retrying...`);
    }
    
    // Wait before retrying
    if (i < maxRetries - 1) {
      const delay = RETRY_DELAY * (i + 1);
      console.log(`Waiting ${delay}ms before retry ${i+2}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log(`All retries failed for ${url}`);
  throw lastError;
}

// Helper function to safely parse a CSV file
async function safeParseCSV(text: string): Promise<any[]> {
  try {
    const result = await parseCSV(text, { skipFirstRow: true });
    return result || [];
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
    
    console.log(`Fetching description for ${courseCode} from ${url}`);
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      console.log(`Failed to fetch description for ${courseCode}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract description using a simple regex pattern
    const descriptionMatch = html.match(/<div class="catalogue-description">([\s\S]*?)<\/div>/);
    if (descriptionMatch && descriptionMatch[1]) {
      const cleanDescription = descriptionMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
        .trim();
      console.log(`Found description for ${courseCode}: ${cleanDescription.substring(0, 50)}...`);
      return cleanDescription;
    }
    
    console.log(`No description found for ${courseCode}`);
    return null;
  } catch (error) {
    console.error(`Error fetching description for ${courseCode}:`, error);
    return null;
  }
}

// Main function to process a school and fetch its courses
async function processSchool(school: string, term: string): Promise<any[]> {
  try {
    console.log(`Processing school: ${school} for term ${term}`);
    
    // Construct the URL for the CSV file
    const csvUrl = `https://classes.usc.edu/term-${term}/${school}/csv/`;
    
    console.log(`Fetching CSV from: ${csvUrl}`);
    
    // Fetch the CSV file with retry logic
    const response = await fetchWithRetry(csvUrl);
    
    if (!response.ok) {
      console.log(`Failed to fetch CSV for ${school}: ${response.status}`);
      return [];
    }
    
    // Parse the CSV data
    const csvText = await response.text();
    
    // Check if we got valid CSV content
    if (!csvText || csvText.includes("Page not found") || csvText.includes("<html")) {
      console.log(`No valid CSV content for ${school}`);
      return [];
    }
    
    const rows = await safeParseCSV(csvText);
    
    if (!rows || rows.length === 0) {
      console.log(`No valid data in CSV for ${school}`);
      return [];
    }
    
    console.log(`Found ${rows.length} courses for ${school}`);
    
    // Process each row in the CSV
    const schoolCourses = [];
    
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
      if (schoolCourses.length < 20) { // Only fetch descriptions for first 20 courses per school
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
      
      schoolCourses.push(course);
    }
    
    return schoolCourses;
  } catch (err) {
    console.error(`Error processing ${school}:`, err);
    return [];
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
    // This is a more comprehensive list of USC schools and departments
    const schools = [
      // Core schools
      'dornsife', 'marshall', 'viterbi', 'annenberg', 'cinematic-arts',
      'price', 'architecture', 'dramatic-arts', 'roski', 'thornton',
      // Professional schools
      'law', 'keck', 'pharmacy', 'chan', 'dent',
      // Additional schools and special programs
      'davis', 'rossier', 'social-work', 'iovine-young', 'gero', 
      'bovard', 'independent-health',
      // Direct department codes that might be used in the URL
      'acad', 'amst', 'anth', 'bisc', 'buad', 'chem', 'comm', 'csci', 
      'dsci', 'econ', 'engl', 'engr', 'hist', 'ling', 'math', 'phil',
      'phys', 'pols', 'psyc', 'soci'
    ];
    
    // Process schools in parallel to improve speed
    let allCourses: any[] = [];
    const fetchPromises: Promise<any[]>[] = [];
    
    // Process each school - use Promise.all to run in parallel
    for (const school of schools) {
      fetchPromises.push(processSchool(school, term));
    }
    
    // Wait for all promises to resolve
    const schoolResults = await Promise.all(fetchPromises);
    
    // Combine all results
    for (const courses of schoolResults) {
      allCourses = allCourses.concat(courses);
    }
    
    console.log(`Total courses gathered: ${allCourses.length}`);
    
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
    const BATCH_SIZE = 50; // Smaller batches to avoid issues
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < uniqueCourses.length; i += BATCH_SIZE) {
      const batch = uniqueCourses.slice(i, i + BATCH_SIZE);
      
      try {
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(uniqueCourses.length/BATCH_SIZE)}, size: ${batch.length}`);
        
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
          console.error(`Error storing batch:`, error);
          errorCount += batch.length;
        } else {
          console.log(`Successfully stored batch`);
          successCount += batch.length;
        }
      } catch (error) {
        console.error(`Exception storing batch:`, error);
        errorCount += batch.length;
      }
      
      // Add a delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported ${successCount} USC courses for term ${term}. Errors: ${errorCount}.`,
        coursesProcessed: uniqueCourses.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
