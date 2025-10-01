
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches course details from the most appropriate course table
 * based on the course number/ID
 */
export async function fetchCourseDetails(courseId: string) {
  console.log(`[fetchCourseDetails] Looking up course: ${courseId}`);
  
  // Try courses-20251 (Spring 2025)
  try {
    console.log(`[fetchCourseDetails] Checking courses-20251 for ${courseId}`);
    const { data: courseData, error } = await supabase
      .from('courses-20251')
      .select('Course number, Course title, Instructor')
      .eq('Course number', courseId)
      .maybeSingle();
    
    if (!error && courseData) {
      console.log(`[fetchCourseDetails] Found in courses-20251:`, courseData);
      return {
        id: courseId,
        course_number: courseData["Course number"] || courseId,
        course_title: courseData["Course title"] || '',
        instructor: courseData["Instructor"] || null
      };
    }
    if (error) {
      console.warn(`[fetchCourseDetails] Error querying courses-20251:`, error);
    }
  } catch (error) {
    console.warn(`[fetchCourseDetails] Exception fetching from courses-20251:`, error);
  }
  
  // Try courses-20252 (Summer 2025)
  try {
    console.log(`[fetchCourseDetails] Checking courses-20252 for ${courseId}`);
    const { data: courseData, error } = await supabase
      .from('courses-20252')
      .select('Course number, Course title, Instructor')
      .eq('Course number', courseId)
      .maybeSingle();
    
    if (!error && courseData) {
      console.log(`[fetchCourseDetails] Found in courses-20252:`, courseData);
      return {
        id: courseId,
        course_number: courseData["Course number"] || courseId,
        course_title: courseData["Course title"] || '',
        instructor: courseData["Instructor"] || null
      };
    }
    if (error) {
      console.warn(`[fetchCourseDetails] Error querying courses-20252:`, error);
    }
  } catch (error) {
    console.warn(`[fetchCourseDetails] Exception fetching from courses-20252:`, error);
  }
  
  // Try courses-20253 (Fall 2025)
  try {
    console.log(`[fetchCourseDetails] Checking courses-20253 for ${courseId}`);
    const { data: courseData, error } = await supabase
      .from('courses-20253')
      .select('Course number, Course title, Instructor')
      .eq('Course number', courseId)
      .maybeSingle();
    
    if (!error && courseData) {
      console.log(`[fetchCourseDetails] Found in courses-20253:`, courseData);
      return {
        id: courseId,
        course_number: courseData["Course number"] || courseId,
        course_title: courseData["Course title"] || '',
        instructor: courseData["Instructor"] || null
      };
    }
    if (error) {
      console.warn(`[fetchCourseDetails] Error querying courses-20253:`, error);
    }
  } catch (error) {
    console.warn(`[fetchCourseDetails] Exception fetching from courses-20253:`, error);
  }
  
  // Return default course details if not found in any table
  console.warn(`[fetchCourseDetails] Course ${courseId} not found in any term table`);
  return {
    id: courseId,
    course_number: courseId,
    course_title: '',
    instructor: null
  };
}
