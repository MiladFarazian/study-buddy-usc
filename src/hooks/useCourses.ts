import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseFilterOptions, TermCourse } from "@/types/CourseTypes";

export function useCourses(filterOptions: CourseFilterOptions) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses when term changes
  useEffect(() => {
    async function fetchCourses() {
      if (!filterOptions.term) {
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching courses for term: ${filterOptions.term}`);
        
        // Special handling for Fall 2025 (term code 20253)
        if (filterOptions.term === '20253') {
          console.log('Using Fall 2025 specific table: courses-20253');
          
          try {
            // Query directly from the courses-20253 table
            const { data, error } = await supabase
              .from('courses-20253')
              .select('*');
              
            if (error) {
              console.error("Direct query failed:", error);
              throw error;
            }
            
            if (data && data.length > 0) {
              console.log(`Found ${data.length} courses in Fall 2025 table`);
              
              // Convert to our standard Course type
              const typedCourses: Course[] = data.map(item => ({
                id: item.id || crypto.randomUUID(),
                course_number: item['Course number'] || '',
                course_title: item['Course title'] || '',
                department: item.department || '',
                instructor: item.Instructor || null,
                // Set legacy fields for compatibility
                code: item['Course number'] || '',
                name: item['Course title'] || '',
                description: null
              }));
              
              setCourses(typedCourses);
              setLoading(false);
              return;
            }
          } catch (directQueryError) {
            console.error("Direct table query failed:", directQueryError);
            // Continue to fallback methods
          }
          
          // Fallback to edge function for Fall 2025
          try {
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/query_term_courses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabase.supabaseKey}`
              },
              body: JSON.stringify({ term_code: filterOptions.term })
            });
            
            if (!response.ok) {
              throw new Error(`Edge function returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && Array.isArray(data) && data.length > 0) {
              console.log(`Found ${data.length} courses via edge function for Fall 2025`);
              
              const typedCourses: Course[] = data.map(item => ({
                id: item.id || crypto.randomUUID(),
                course_number: item['Course number'] || '',
                course_title: item['Course title'] || '',
                department: item.department || '',
                instructor: item.Instructor || null,
                // Set legacy fields for compatibility
                code: item['Course number'] || '',
                name: item['Course title'] || '',
                description: null
              }));
              
              setCourses(typedCourses);
              setLoading(false);
              return;
            }
          } catch (edgeFunctionError) {
            console.error("Edge function query failed:", edgeFunctionError);
            // Continue to general term table handling
          }
        }
        
        // Get the corresponding term table
        const { data: termTableData, error: termTableError } = await supabase.rpc(
          'list_term_tables',
          {}
        );
        
        if (termTableError) {
          console.error("Error getting term tables:", termTableError);
          throw termTableError;
        }
        
        const termTable = termTableData?.find((t: any) => t.term_code === filterOptions.term);
        
        if (!termTable) {
          // Fall back to the original courses table if no term-specific table exists
          const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("term_code", filterOptions.term);
            
          if (error) {
            console.error("Database error:", error);
            throw error;
          }
          
          if (data) {
            console.log(`Found ${data.length} courses for term ${filterOptions.term} in main courses table`);
            // Convert the database response to the Course type
            const typedCourses: Course[] = data.map(item => ({
              id: item.id,
              course_number: item.code,
              course_title: item.name,
              department: item.department,
              instructor: item.instructor || null,
              description: item.description,
              // Keep legacy fields for compatibility
              code: item.code,
              name: item.name,
              term_code: item.term_code || '',
              units: item.units || '',
              days: item.days || '',
              time: item.time || '',
              location: item.location || '',
              session_type: item.session_type || ''
            }));
            setCourses(typedCourses);
          } else {
            setCourses([]);
          }
        } else {
          // Query from the term-specific table via edge function
          try {
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/query_term_courses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabase.supabaseKey}`
              },
              body: JSON.stringify({ term_code: filterOptions.term })
            });
            
            if (!response.ok) {
              throw new Error(`Edge function returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && Array.isArray(data) && data.length > 0) {
              console.log(`Found ${data.length} courses via edge function`);
              
              const typedCourses: Course[] = data.map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                course_number: item.course_number || '',
                course_title: item.course_title || '',
                department: item.department || '',
                instructor: item.instructor || null,
                // Set legacy fields for compatibility
                code: item.course_number,
                name: item.course_title,
                description: null
              }));
              
              setCourses(typedCourses);
            } else {
              setCourses([]);
            }
          } catch (error) {
            console.error("Edge function query failed:", error);
            setCourses([]);
            throw error;
          }
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, [filterOptions.term]);

  // Extract unique departments
  useEffect(() => {
    if (courses.length > 0) {
      const uniqueDepartments = Array.from(
        new Set(courses.map(course => course.department))
      ).sort();
      setDepartments(uniqueDepartments);
    } else {
      setDepartments([]);
    }
  }, [courses]);

  // Filter courses based on search and department
  useEffect(() => {
    let result = [...courses];
    
    // Filter by search query
    if (filterOptions.search) {
      const query = filterOptions.search.toLowerCase();
      result = result.filter(
        course => 
          (course.course_number && course.course_number.toLowerCase().includes(query)) ||
          (course.course_title && course.course_title.toLowerCase().includes(query)) ||
          (course.code && course.code.toLowerCase().includes(query)) ||
          (course.name && course.name.toLowerCase().includes(query)) ||
          (course.instructor && course.instructor.toLowerCase().includes(query)) ||
          (course.description && course.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by department
    if (filterOptions.department && filterOptions.department !== "all") {
      result = result.filter(course => course.department === filterOptions.department);
    }
    
    setFilteredCourses(result);
  }, [courses, filterOptions.search, filterOptions.department]);

  return { 
    courses: filteredCourses,
    allCourses: courses,
    departments,
    loading,
    error
  };
}
