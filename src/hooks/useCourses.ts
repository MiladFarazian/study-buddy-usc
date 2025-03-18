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
          // Query from the term-specific table
          console.log(`Using term-specific table: ${termTable.table_name}`);
          
          try {
            // Use raw SQL query for schema.table access
            const { data, error } = await supabase.rpc(
              'execute_sql',
              { sql: `SELECT * FROM ${termTable.table_name}` }
            );
            
            if (error) {
              console.error("Using RPC query failed:", error);
              throw error;
            }
            
            if (data) {
              // The data from execute_sql might be in _temp_result
              const { data: tempData, error: tempError } = await supabase
                .from('_temp_result')
                .select('*');
                
              if (tempError) {
                console.error("Failed to get temp results:", tempError);
                throw tempError;
              }
              
              if (tempData && tempData.length > 0) {
                console.log(`Found ${tempData.length} courses in temp results`);
                
                // Cast the result to our expected type structure
                const termCourses = tempData as unknown as TermCourse[];
                
                // Convert to our standard Course type
                const typedCourses: Course[] = termCourses.map(item => ({
                  id: item.id,
                  course_number: item.course_number,
                  course_title: item.course_title,
                  department: item.department || '',
                  instructor: item.instructor,
                  // Set legacy fields for compatibility
                  code: item.course_number,
                  name: item.course_title,
                  description: null
                }));
                
                setCourses(typedCourses);
              } else {
                setCourses([]);
              }
            } else {
              setCourses([]);
            }
          } catch (queryError) {
            console.error("Error with database query:", queryError);
            
            // Try direct SQL query via Postgres function
            try {
              // Use REST API call to directly query the term table
              const tableName = termTable.table_name.split('.')[1];
              const { data, error } = await fetch(
                `${process.env.SUPABASE_URL}/rest/v1/rpc/list_term_courses?term_table=${tableName}`,
                {
                  method: 'GET',
                  headers: {
                    'apikey': `${process.env.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                  }
                }
              ).then(res => res.json());
              
              if (error) {
                console.error("REST API query failed:", error);
                throw error;
              }
              
              if (data && Array.isArray(data)) {
                const typedCourses: Course[] = data.map((item: any) => ({
                  id: item.id,
                  course_number: item.course_number,
                  course_title: item.course_title,
                  department: item.department || '',
                  instructor: item.instructor,
                  // Set legacy fields for compatibility
                  code: item.course_number,
                  name: item.course_title,
                  description: null
                }));
                
                setCourses(typedCourses);
              } else {
                setCourses([]);
              }
            } catch (restError) {
              console.error("All query methods failed:", restError);
              setCourses([]);
            }
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
