import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { parse as parseCSV } from "https://deno.land/std@0.177.0/encoding/csv.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Known departments at USC
const knownDepartments = [
  'csci', 'math', 'buad', 'econ', 'engr', 'psyc', 'comm', 'bisc',
  'acct', 'ahis', 'amst', 'anth', 'astr', 'bioc', 'chem', 'clas',
  'engl', 'fren', 'geog', 'germ', 'hist', 'ital', 'ling', 'phil',
  'phys', 'poir', 'soci', 'span', 'art', 'arth', 'asc', 'baep',
  'biol', 'bme', 'ce', 'cmgt', 'ctin', 'dsci', 'ealc', 'ee', 'fbe',
  'geol', 'gero', 'hbio', 'iml', 'ir', 'itp', 'jour', 'law', 'lim',
  'masc', 'mda', 'mech', 'mpw', 'mptx', 'ms', 'musc', 'naut', 'neur',
  'nsci', 'ppe', 'phed', 'ppa', 'ppd', 'pte', 'ptx', 'rel', 'rus',
  'swms', 'thtr', 'visi', 'writ'
];

// Add schools/colleges that might have specific pages
const schools = [
  'dornsife', 'marshall', 'viterbi', 'annenberg', 'cinematic-arts',
  'price', 'architecture', 'dramatic-arts', 'roski', 'thornton',
  'law', 'keck', 'pharmacy', 'chan', 'dent',
  'davis', 'rossier', 'social-work', 'iovine-young', 'gero', 
  'bovard', 'independent-health'
];

// Retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

// Helper function to retry fetches
async function fetchWithRetry(url: string, options = {}, maxRetries = MAX_RETRIES): Promise<Response> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i+1}: Fetching ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
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
  
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

// Helper function to safely parse a CSV file
async function safeParseCSV(text: string): Promise<any[]> {
  try {
    if (!text || text.includes("Page not found") || text.includes("<html")) {
      console.log("Invalid CSV content");
      return [];
    }
    
    const result = await parseCSV(text, { skipFirstRow: true });
    return result || [];
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}

// Modified function to fetch CSV data correctly
async function fetchDepartmentCSV(dept: string, term: string): Promise<string> {
  try {
    // First, access the department/school page
    const pageUrl = `https://classes.usc.edu/term-${term}/classes/${dept}/`;
    console.log(`Fetching department page: ${pageUrl}`);
    
    const pageResponse = await fetchWithRetry(pageUrl);
    if (!pageResponse.ok) {
      console.log(`Failed to fetch department page for ${dept}: ${pageResponse.status}`);
      return '';
    }
    
    const html = await pageResponse.text();
    
    // Look for the CSV download link in the page content
    // The CSV link typically appears as "Download CSV" or similar text
    const csvLinkRegex = /<a[^>]+href="([^"]+\/csv\/[^"]*)"[^>]*>(?:[^<]*CSV|[^<]*csv)[^<]*<\/a>/i;
    const csvMatch = html.match(csvLinkRegex);
    
    if (!csvMatch || !csvMatch[1]) {
      console.log(`Could not find CSV download link for ${dept}`);
      return '';
    }
    
    // Extract the CSV URL and make it absolute if needed
    let csvUrl = csvMatch[1];
    if (csvUrl.startsWith('/')) {
      csvUrl = `https://classes.usc.edu${csvUrl}`;
    } else if (!csvUrl.startsWith('http')) {
      csvUrl = new URL(csvUrl, pageUrl).href;
    }
    
    console.log(`Found CSV URL: ${csvUrl}`);
    
    // Now fetch the actual CSV file
    const csvResponse = await fetchWithRetry(csvUrl);
    if (!csvResponse.ok) {
      console.log(`Failed to fetch CSV for ${dept}: ${csvResponse.status}`);
      return '';
    }
    
    return await csvResponse.text();
  } catch (error) {
    console.error(`Error fetching CSV for ${dept}:`, error);
    return '';
  }
}

// Helper function to extract course description from USC website
async function fetchCourseDescription(courseCode: string, termCode: string): Promise<string | null> {
  try {
    const department = courseCode.split('-')[0].trim();
    const courseNumber = courseCode.split('-')[1]?.trim();
    
    if (!department || !courseNumber) return null;
    
    const url = `https://classes.usc.edu/term-${termCode}/classes/${department.toLowerCase()}/`;
    
    console.log(`Fetching course page for ${courseCode} from ${url}`);
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      console.log(`Failed to fetch department page for ${courseCode}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Look for links to the specific course
    const courseRegex = new RegExp(`href="([^"]+${courseNumber}[^"]*)"`, 'i');
    const courseMatch = html.match(courseRegex);
    
    if (!courseMatch || !courseMatch[1]) {
      console.log(`Could not find course link for ${courseCode}`);
      return null;
    }
    
    const courseUrl = new URL(courseMatch[1], url).href;
    console.log(`Found course URL: ${courseUrl}`);
    
    // Fetch the course detail page
    const courseResponse = await fetchWithRetry(courseUrl);
    if (!courseResponse.ok) {
      console.log(`Failed to fetch course details for ${courseCode}: ${courseResponse.status}`);
      return null;
    }
    
    const courseHtml = await courseResponse.text();
    
    // Extract description using regex
    const descriptionMatch = courseHtml.match(/<div class="catalogue-description">([\s\S]*?)<\/div>/);
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

// Updated processDepartment function to use the new CSV fetching method
async function processDepartment(dept: string, term: string): Promise<any[]> {
  try {
    console.log(`Processing department: ${dept} for term ${term}`);
    
    // Fetch CSV using the correct approach
    const csvText = await fetchDepartmentCSV(dept, term);
    
    if (!csvText) {
      console.log(`No CSV data found for ${dept}`);
      return [];
    }
    
    // Parse the CSV data
    const rows = await safeParseCSV(csvText);
    
    if (!rows || rows.length === 0) {
      console.log(`No valid data in CSV for ${dept}`);
      return [];
    }
    
    console.log(`Found ${rows.length} courses for ${dept}`);
    
    // Process each row in the CSV
    const deptCourses = [];
    
    for (const row of rows) {
      // CSV format: number,title,units,type,days,time,location,instructor
      if (row.length < 8) {
        console.log(`Skipping incomplete row for ${dept}:`, row);
        continue;
      }
      
      const [courseNumber, name, units, type, days, time, location, instructor] = row;
      
      // Skip if no valid course number
      if (!courseNumber) {
        console.log(`Skipping row with no course number for ${dept}`);
        continue;
      }
      
      // Format the course code (e.g., "CSCI-102")
      const courseCode = `${dept.toUpperCase()}-${courseNumber}`;
      
      // Remove duplicate spaces and trim
      const cleanName = name.replace(/\s+/g, ' ').trim();
      
      // Fetch course description - limit to first 5 courses per department to avoid rate limiting
      let description = null;
      if (deptCourses.length < 5) { 
        description = await fetchCourseDescription(courseCode, term);
      }
      
      const course = {
        code: courseCode,
        name: cleanName,
        department: dept.toUpperCase(),
        description,
        term_code: term,
        instructor,
        units,
        session_type: type,
        days,
        time,
        location
      };
      
      deptCourses.push(course);
    }
    
    return deptCourses;
  } catch (err) {
    console.error(`Error processing ${dept}:`, err);
    return [];
  }
}

// Update processSchool function similarly
async function processSchool(school: string, term: string): Promise<any[]> {
  try {
    console.log(`Processing school: ${school} for term ${term}`);
    
    // First, try to get the CSV using the correct approach
    const csvText = await fetchDepartmentCSV(school, term);
    
    if (csvText && !csvText.includes("Page not found") && !csvText.includes("<html")) {
      const rows = await safeParseCSV(csvText);
      
      if (rows.length > 0) {
        console.log(`Found ${rows.length} courses for ${school} directly`);
        
        // Process each row in the CSV similar to processDepartment
        const schoolCourses = [];
        
        for (const row of rows) {
          if (row.length < 8) continue;
          
          const [courseNumber, name, units, type, days, time, location, instructor] = row;
          
          if (!courseNumber) continue;
          
          // Extract department from the course number
          const deptMatch = courseNumber.match(/^([A-Za-z]+)/);
          const department = deptMatch ? deptMatch[1].toUpperCase() : school.toUpperCase();
          
          // Format the course code (use the original course number as it may already have the dept code)
          const courseCode = courseNumber.includes('-') ? courseNumber : `${department}-${courseNumber}`;
          
          const cleanName = name.replace(/\s+/g, ' ').trim();
          
          // Only fetch descriptions for the first few courses
          let description = null;
          if (schoolCourses.length < 5) { 
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
      }
    }
    
    // Rest of the existing function for finding departments within the school
    const schoolUrl = `https://classes.usc.edu/term-${term}/${school}/`;
    console.log(`Fetching school page to find departments: ${schoolUrl}`);
    
    const schoolResponse = await fetchWithRetry(schoolUrl);
    if (!schoolResponse.ok) {
      console.log(`Failed to fetch school page for ${school}: ${schoolResponse.status}`);
      return [];
    }
    
    const html = await schoolResponse.text();
    
    // Find department links on the school page
    const deptRegex = /<a[^>]+href="\/term-[^/]+\/([a-z0-9-]+)\/"[^>]*>([^<]+)<\/a>/gi;
    const depts = new Set<string>();
    let match;
    
    while ((match = deptRegex.exec(html)) !== null) {
      const deptSlug = match[1];
      if (deptSlug !== school && !deptSlug.includes('page')) {
        depts.add(deptSlug);
      }
    }
    
    console.log(`Found ${depts.size} departments for ${school}`);
    
    // Process each department in parallel
    const deptPromises = Array.from(depts).map(dept => processDepartment(dept, term));
    const deptResults = await Promise.all(deptPromises);
    
    // Combine all department results
    return deptResults.flat();
  } catch (err) {
    console.error(`Error processing school ${school}:`, err);
    return [];
  }
}

serve(async (req) => {
  console.log("Function triggered");

  // Handle OPTIONS preflight request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { term } = await req.json();
    if (!term) {
      return new Response(JSON.stringify({ error: "Term is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Starting data collection for term: ${term}`);

    const allResults = [];

    // Process known departments
    for (const dept of knownDepartments) {
      const deptCourses = await processDepartment(dept, term);
      allResults.push(...deptCourses);
    }

    // Process schools
    for (const school of schools) {
      const schoolCourses = await processSchool(school, term);
      allResults.push(...schoolCourses);
    }

    console.log(`Total courses collected: ${allResults.length}`);

    return new Response(JSON.stringify({ data: allResults }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
