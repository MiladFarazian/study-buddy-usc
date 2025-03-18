
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseFilterOptions } from "@/types/CourseTypes";

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
              code: item.code,
              name: item.name,
              department: item.department,
              description: item.description,
              term_code: item.term_code || '',
              instructor: item.instructor || '',
              units: item.units || '',
              days: item.days || '',
              time: item.time || '',
              location: item.location || '',
              session_type: item.session_type || '',
              // Map to new fields for compatibility
              course_number: item.code,
              course_title: item.name
            }));
            setCourses(typedCourses);
          } else {
            setCourses([]);
          }
        } else {
          // Query from the term-specific table
          console.log(`Using term-specific table: ${termTable.table_name}`);
          
          // Since we can't use a dynamic table name with .from(), use the SQL function
          const { data, error } = await supabase.rpc(
            'execute_sql',
            { sql: `SELECT * FROM ${termTable.table_name}` }
          ).then(() => supabase.from('_temp_result').select('*'));
          
          if (error) {
            // If executing the RPC fails, try a direct query which requires different permissions
            console.log("Using direct query as fallback method");
            const result = await supabase.from(termTable.table_name.replace('terms.', '')).select('*');
            
            if (result.error) {
              console.error("Database error with direct query:", result.error);
              
              // As a last resort, try a raw SQL query
              console.log("Attempting raw SQL query as final fallback");
              const rawResult = await supabase.rpc(
                'execute_sql',
                { sql: `SELECT * FROM ${termTable.table_name}` }
              );
              
              if (rawResult.error) {
                throw rawResult.error;
              }
              
              // For raw queries, we don't always get data directly
              console.log("Raw SQL query result:", rawResult);
              setCourses([]);
              return;
            }
            
            const typedCourses: Course[] = result.data.map(item => ({
              id: item.id,
              course_number: item.course_number,
              course_title: item.course_title,
              department: item.department,
              instructor: item.instructor,
              // Map to old fields for compatibility
              code: item.course_number,
              name: item.course_title,
              description: null
            }));
            
            console.log(`Found ${typedCourses.length} courses in term-specific table`);
            setCourses(typedCourses);
          } else if (data) {
            console.log(`Found ${data.length} courses in term-specific table via RPC`);
            const typedCourses: Course[] = data.map(item => ({
              id: item.id,
              course_number: item.course_number,
              course_title: item.course_title,
              department: item.department,
              instructor: item.instructor,
              // Map to old fields for compatibility
              code: item.course_number,
              name: item.course_title,
              description: null
            }));
            setCourses(typedCourses);
          } else {
            setCourses([]);
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
