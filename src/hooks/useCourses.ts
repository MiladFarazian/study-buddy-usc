
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseFilterOptions, TermCourse } from "@/types/CourseTypes";
import { searchCourses } from "@/lib/search-utils";

// Department code to friendly name mapping
const DEPARTMENT_NAMES: Record<string, string> = {
  'CSCI': 'Computer Science',
  'ECON': 'Economics',
  'FBE': 'Business & Finance',
  'BUAD': 'Business Administration',
  'ACCT': 'Accounting',
  'BAEP': 'Business Entrepreneurship',
  'AME': 'Mechanical Engineering',
  'EE': 'Electrical Engineering',
  'CE': 'Civil Engineering',
  'GEOL': 'Geology',
  'CHEM': 'Chemistry',
  'BISC': 'Biological Sciences',
  'PHYS': 'Physics',
  'MATH': 'Mathematics',
  'WRIT': 'Writing',
  'ENGL': 'English',
  'HIST': 'History',
  'PSYC': 'Psychology',
  'SOCI': 'Sociology',
  'ANTH': 'Anthropology',
  'POIR': 'Political Science',
  'ACAD': 'Academic',
  'ACMD': 'Academic Medicine',
  'ADNT': 'Advanced Dentistry',
  'ADSC': 'Advanced Science',
  'AEST': 'Aesthetics',
  'AHIS': 'Art History',
  'ALI': 'Applied Linguistics',
  'AMST': 'American Studies',
};

export function useCourses(filterOptions: CourseFilterOptions) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  const PAGE_SIZE = 50;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
    setCourses([]);
    setHasMore(true);
  }, [filterOptions.term, filterOptions.search, filterOptions.department]);

  // Fetch courses with pagination and filtering
  useEffect(() => {
    async function fetchCoursesPage() {
      if (!filterOptions.term) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const isFirstPage = currentPage === 0;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      
      try {
        const tableName = `courses-${filterOptions.term}`;
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        
        console.log(`Fetching courses page ${currentPage} (rows ${from} to ${to})`);
        
        let query = supabase
          .from(tableName as any)
          .select('*', { count: 'exact' })
          .range(from, to);
        
        // Apply department filter server-side
        if (filterOptions.department && filterOptions.department !== "all") {
          query = query.ilike('"Course number"', `${filterOptions.department}-%`);
        }
        
        // Apply search filter server-side
        if (filterOptions.search) {
          const searchTerm = filterOptions.search.toLowerCase();
          query = query.or(
            `"Course number".ilike.*${searchTerm}*,"Course title".ilike.*${searchTerm}*,Instructor.ilike.*${searchTerm}*`
          );
        }
        
        const { data, error: queryError, count } = await query;
        
        if (queryError) {
          console.error("Query error:", queryError);
          throw queryError;
        }
        
        if (data) {
          console.log(`Retrieved ${data.length} courses for page ${currentPage}`);
          
          // Convert to our standard Course type
          const typedCourses: Course[] = data.map((item: any) => {
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
          
          if (isFirstPage) {
            setCourses(typedCourses);
          } else {
            setCourses(prev => [...prev, ...typedCourses]);
          }
          
          setTotalCount(count || 0);
          setHasMore(data.length === PAGE_SIZE && (count ? from + data.length < count : true));
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        if (currentPage === 0) {
          setCourses([]);
        }
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
    
    fetchCoursesPage();
  }, [filterOptions.term, filterOptions.search, filterOptions.department, currentPage]);

  // Fetch all departments once (for the filter dropdown)
  useEffect(() => {
    async function fetchDepartments() {
      if (!filterOptions.term) return;
      
      try {
        const tableName = `courses-${filterOptions.term}`;
        const { data } = await supabase
          .from(tableName as any)
          .select('"Course number"')
          .limit(10000);
        
        if (data) {
          const uniqueDeptCodes = Array.from(
            new Set(data.map((item: any) => item["Course number"]?.split('-')[0]).filter(Boolean))
          ).sort();
          
          const deptArray = uniqueDeptCodes.map(code => ({
            code,
            name: DEPARTMENT_NAMES[code as string] || code
          })).sort((a, b) => a.name.localeCompare(b.name));
          
          setDepartments(deptArray as any);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    }
    
    fetchDepartments();
  }, [filterOptions.term]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return { 
    courses,
    allCourses: courses,
    departments,
    loading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
    totalCount,
    currentCount: courses.length
  };
}
