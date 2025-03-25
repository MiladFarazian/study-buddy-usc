
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";

export function usePopularCourses(limit: number = 20) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPopularCourses() {
      setLoading(true);
      setError(null);
      
      try {
        // Query profile subjects to find the most commonly added courses
        // This doesn't need authentication as we're just fetching public data
        const { data: profileCourses, error: profileError } = await supabase
          .from('profiles')
          .select('subjects')
          .not('subjects', 'is', null);
        
        if (profileError) {
          throw profileError;
        }
        
        // Count frequency of each course
        const courseFrequency: Record<string, number> = {};
        
        profileCourses.forEach(profile => {
          if (profile.subjects && Array.isArray(profile.subjects)) {
            profile.subjects.forEach(courseNumber => {
              courseFrequency[courseNumber] = (courseFrequency[courseNumber] || 0) + 1;
            });
          }
        });
        
        // Sort course numbers by frequency
        const popularCourseNumbers = Object.entries(courseFrequency)
          .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
          .slice(0, limit) // Take top courses
          .map(entry => entry[0]); // Get course numbers
        
        if (popularCourseNumbers.length === 0) {
          // Try loading some default courses if no popular ones found
          const { data: defaultCourses, error: defaultCoursesError } = await supabase
            .from('tutor_courses')
            .select('*')
            .limit(limit);
            
          if (defaultCoursesError) {
            throw defaultCoursesError;
          }
          
          if (defaultCourses && defaultCourses.length > 0) {
            const formattedDefaultCourses = defaultCourses.map(item => ({
              id: item.id,
              course_number: item.course_number,
              course_title: item.course_title,
              instructor: null,
              department: item.department || item.course_number.split('-')[0],
              popularity: 1
            }));
            
            setCourses(formattedDefaultCourses);
            setLoading(false);
            return;
          }
          
          setCourses([]);
          setLoading(false);
          return;
        }
        
        // Fetch course details from tutor_courses table (which has more info than just the course number)
        const { data: courseData, error: courseError } = await supabase
          .from('tutor_courses')
          .select('*')
          .in('course_number', popularCourseNumbers);
        
        if (courseError) {
          throw courseError;
        }
        
        // Convert to standard Course format and sort by popularity
        const formattedCourses = courseData.map(item => ({
          id: item.id,
          course_number: item.course_number,
          course_title: item.course_title,
          instructor: null,
          department: item.department || item.course_number.split('-')[0],
          // Frequency used for sorting
          popularity: courseFrequency[item.course_number] || 0
        }));
        
        // Sort by popularity
        const sortedCourses = formattedCourses.sort((a, b) => 
          (b.popularity || 0) - (a.popularity || 0)
        );
        
        setCourses(sortedCourses);
      } catch (err: any) {
        console.error("Error fetching popular courses:", err);
        setError(err.message || "Failed to fetch popular courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPopularCourses();
  }, [limit]);

  return { 
    courses,
    loading,
    error
  };
}
