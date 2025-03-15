
import { useState, useEffect } from "react";
import { Course } from "@/integrations/supabase/types-extension";

export function useCoursesFilter(courses: Course[], searchQuery: string, selectedDepartment: string) {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  
  // Extract unique departments from courses
  const extractDepartments = (courses: Course[]): string[] => {
    const uniqueDepartments = [...new Set(courses.map(course => course.department))];
    return uniqueDepartments.sort();
  };

  const departments = extractDepartments(courses);
  
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
