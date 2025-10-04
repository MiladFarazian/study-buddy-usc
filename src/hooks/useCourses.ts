
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
        
        // When searching, fetch ALL courses (paginated batches) to apply client-side ranking algorithm
        // Otherwise use pagination
        const isSearching = filterOptions.search && filterOptions.search.trim() !== '';
        
        let baseQuery = supabase.from(tableName as any).select('*', { count: 'exact' });
        
        // Apply department filter server-side (reduces dataset before client ranking)
        if (filterOptions.department && filterOptions.department !== "all") {
          baseQuery = baseQuery.ilike('"Course number"', `${filterOptions.department}-%`);
        }
        
        let data: any[] | null = null;
        let count: number | null = null;

        if (isSearching) {
          // Fetch the entire dataset for the term (and department, if any) in batches
          const BATCH_SIZE = 1000;
          let allRows: any[] = [];
          let from = 0;
          let to = BATCH_SIZE - 1;
          let total: number | null = null;

          // First batch to get count
          let first = await baseQuery.range(from, to);
          if (first.error) {
            throw first.error;
          }
          allRows = allRows.concat(first.data || []);
          total = first.count ?? null;

          if (total && allRows.length < total) {
            // Continue fetching until we've got everything
            while (allRows.length < total) {
              from += BATCH_SIZE;
              to += BATCH_SIZE;
              const { data: batch, error } = await baseQuery.range(from, to);
              if (error) throw error;
              if (!batch || batch.length === 0) break;
              allRows = allRows.concat(batch);
            }
          }

          data = allRows;
          count = total ?? (allRows ? allRows.length : 0);
        } else {
          // Normal pagination
          const from = currentPage * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          const { data: pageData, error: queryError, count: pageCount } = await baseQuery.range(from, to);
          if (queryError) throw queryError;
          data = pageData;
          count = pageCount ?? null;
        }
        
        if (data) {
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
          
          // Apply client-side search algorithm if searching
          const finalCourses = isSearching 
            ? searchCourses(typedCourses, filterOptions.search!)
            : typedCourses;
          
          if (isFirstPage || isSearching) {
            setCourses(finalCourses);
          } else {
            setCourses(prev => [...prev, ...finalCourses]);
          }
          
          setTotalCount(isSearching ? finalCourses.length : (count || 0));
          setHasMore(!isSearching && data.length === PAGE_SIZE && (count ? currentPage * PAGE_SIZE + data.length < count : true));
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
