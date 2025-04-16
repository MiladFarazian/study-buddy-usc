
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches course details from the most appropriate course table
 * based on the course number/ID
 */
export async function fetchCourseDetails(courseId: string) {
  // Try to fetch from the primary term table (20251)
  try {
    const { data: courseData } = await supabase
      .from('courses-20251')
      .select('Course number, Course title')
      .eq('Course number', courseId)
      .maybeSingle();
      
    if (courseData) {
      return {
        id: courseId,
        course_number: courseData["Course number"] || courseId,
        course_title: courseData["Course title"] || ''
      };
    }
  } catch (error) {
    console.warn("Error fetching from primary course table:", error);
  }
  
  // If not found in primary, try other term tables
  try {
    const { data: courseData } = await supabase
      .from('courses-20252')
      .select('Course number, Course title')
      .eq('Course number', courseId)
      .maybeSingle();
      
    if (courseData) {
      return {
        id: courseId,
        course_number: courseData["Course number"] || courseId,
        course_title: courseData["Course title"] || ''
      };
    }
  } catch (error) {
    console.warn("Error fetching from secondary course table:", error);
  }
  
  // Return default course details if not found
  return {
    id: courseId,
    course_number: courseId,
    course_title: ''
  };
}
