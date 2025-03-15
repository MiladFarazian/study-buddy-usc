
import { useState, useEffect, useMemo } from "react";
import { Course } from "@/integrations/supabase/types-extension";

export function useCoursesFilter(
  courses: Course[], 
  searchQuery: string, 
  selectedDepartment: string
) {
  // Use proper type annotation to avoid deep inference
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  
  // Memoize departments to avoid unnecessary recalculations and type depth issues
  const departments = useMemo(() => {
    const uniqueDepartments = [...new Set(courses.map(course => course.department))];
    return uniqueDepartments.sort();
  }, [courses]);
  
  // Filter courses based on search query and selected department
  useEffect(() => {
    let filtered = [...courses];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.code.toLowerCase().includes(query) ||
          course.name.toLowerCase().includes(query) ||
          (course.description && course.description.toLowerCase().includes(query))
      );
    }
    
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(course => course.department === selectedDepartment);
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, selectedDepartment]);
  
  return { filteredCourses, departments };
}
