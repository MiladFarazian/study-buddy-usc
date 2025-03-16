// Modified function to fetch CSV data correctly
async function fetchDepartmentCSV(dept: string, term: string): Promise<string> {
  try {
    // First, access the department/school page
    const pageUrl = `https://classes.usc.edu/term-${term}/${dept}/`;
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
    
    // Process each row in the CSV (keep this part of your original code)
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