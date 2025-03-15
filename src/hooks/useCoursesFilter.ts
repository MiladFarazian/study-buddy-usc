
import { useState, useEffect, useMemo } from "react";
import { Course } from "@/integrations/supabase/types-extension";

export function useCoursesFilter(
  courses: Course[], 
  searchQuery: string, 
  selectedDepartment: string
) {
  // Use explicit type annotation for state
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  
  // Use a simplified department extraction approach
  const departments = useMemo(() => {
    if (!courses.length) return [];
    
    // Extract unique departments with a simpler approach
    const deptSet = new Set<string>();
    courses.forEach(course => {
      if (course.department) {
        deptSet.add(course.department);
      }
    });
    
    return Array.from(deptSet).sort();
  }, [courses]);
  
  // Filter courses based on search query and selected department
  useEffect(() => {
    if (!courses.length) {
      setFilteredCourses([]);
      return;
    }
    
    let result = courses;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course =>
          (course.code && course.code.toLowerCase().includes(query)) ||
          (course.name && course.name.toLowerCase().includes(query)) ||
          (course.description && course.description.toLowerCase().includes(query))
      );
    }
    
    if (selectedDepartment && selectedDepartment !== "all") {
      result = result.filter(course => course.department === selectedDepartment);
    }
    
    setFilteredCourses(result);
  }, [courses, searchQuery, selectedDepartment]);
  
  return { filteredCourses, departments };
}
