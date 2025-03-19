
import { useState, useEffect, useMemo } from "react";
import { Course } from "@/types/CourseTypes";

export function useCoursesFilter(
  courses: Course[], 
  searchQuery: string, 
  selectedDepartment: string
) {
  // Use explicit type annotation for state and default to empty array
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  
  // Simplify departments extraction with a more direct approach
  const departments = useMemo(() => {
    // Early return for empty courses to avoid unnecessary processing
    if (!courses || courses.length === 0) {
      return [];
    }
    
    // Use a Set for unique departments
    const uniqueDepartments = new Set<string>();
    
    // Safely extract departments with null/undefined checks
    courses.forEach(course => {
      if (course && course.department) {
        uniqueDepartments.add(course.department);
      }
    });
    
    // Convert Set to sorted array
    return Array.from(uniqueDepartments).sort();
  }, [courses]);
  
  // Filter courses with explicit null checks
  useEffect(() => {
    // Handle empty courses array
    if (!courses || courses.length === 0) {
      setFilteredCourses([]);
      return;
    }
    
    let result = [...courses];
    
    // Apply search filter if search query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(course => 
        (course.course_number && course.course_number.toLowerCase().includes(query)) ||
        (course.course_title && course.course_title.toLowerCase().includes(query)) ||
        (course.description && course.description.toLowerCase().includes(query))
      );
    }
    
    // Apply department filter if a specific department is selected
    if (selectedDepartment && selectedDepartment !== "all") {
      result = result.filter(course => course.department === selectedDepartment);
    }
    
    setFilteredCourses(result);
  }, [courses, searchQuery, selectedDepartment]);
  
  return { filteredCourses, departments };
}
