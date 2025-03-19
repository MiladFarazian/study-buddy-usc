
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
        
        // Call the query_term_courses edge function
        const { data: termCourses, error: functionError } = await supabase.functions.invoke('query_term_courses', {
          body: { term_code: filterOptions.term }
        });

        if (functionError) {
          console.error("Edge function error:", functionError);
          throw new Error(`Failed to fetch courses: ${functionError.message}`);
        }
        
        if (termCourses && termCourses.length > 0) {
          console.log(`Found ${termCourses.length} courses from edge function`);
          
          // Convert to our standard Course type
          const typedCourses: Course[] = termCourses.map((item: TermCourse) => {
            // Extract department from course number (e.g., "CSCI-104" -> "CSCI")
            const department = item["Course number"]?.split('-')[0] || 'Unknown';
            
            return {
              id: item.id || crypto.randomUUID(),
              course_number: item["Course number"] || '',
              course_title: item["Course title"] || '',
              instructor: item.Instructor,
              department: item.department || department,
              units: item.units || null,
              days: item.days || null,
              time: item.time || null,
              location: item.location || null,
              description: item.description || null
            };
          });
          
          setCourses(typedCourses);
        } else {
          // Fallback to direct table query if edge function returns no data
          console.log(`No courses found from edge function, trying direct table query`);
          await fetchAllCoursesPaginated(filterOptions.term);
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    
    // Function to fetch all courses with pagination
    async function fetchAllCoursesPaginated(termCode: string) {
      const tableName = `courses-${termCode}`;
      const PAGE_SIZE = 1000;
      let allCourses: any[] = [];
      let page = 0;
      let hasMore = true;
      
      console.log(`Fetching all courses from ${tableName} with pagination`);
      
      try {
        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          
          console.log(`Fetching page ${page} (rows ${from} to ${to})`);
          
          // Use type assertion to help TypeScript understand this is a valid table
          const { data, error, count } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact' })
            .range(from, to);
            
          if (error) {
            console.error(`Error fetching page ${page}:`, error);
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log(`Retrieved ${data.length} courses for page ${page}`);
            allCourses = [...allCourses, ...data];
            
            // Check if there might be more data
            hasMore = data.length === PAGE_SIZE;
            page++;
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Total courses fetched: ${allCourses.length}`);
        
        if (allCourses.length > 0) {
          // Convert to our standard Course type
          const typedCourses: Course[] = allCourses.map((item: any) => {
            // Extract department from course number (e.g., "CSCI-104" -> "CSCI")
            const department = item["Course number"]?.split('-')[0] || 'Unknown';
            
            return {
              id: item.id || crypto.randomUUID(),
              course_number: item["Course number"] || '',
              course_title: item["Course title"] || '',
              instructor: item.Instructor,
              department: item.department || department,
              units: item.units || null,
              days: item.days || null,
              time: item.time || null,
              location: item.location || null,
              description: item.description || null
            };
          });
          
          setCourses(typedCourses);
        } else {
          console.log(`No courses found in ${tableName} table`);
          setCourses([]);
        }
      } catch (err) {
        console.error("Error fetching paginated courses:", err);
        throw err;
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
          (course.instructor && course.instructor.toLowerCase().includes(query))
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
