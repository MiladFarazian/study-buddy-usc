
import { supabase } from "@/integrations/supabase/client";

/**
 * Add a course to a tutor's "Courses I Need Help With" list
 */
export async function addTutorStudentCourse(userId: string, courseNumber: string) {
  try {
    // First check if this course already exists in the tutor_student_courses table
    const { data: existingCourse, error: checkError } = await supabase
      .from("tutor_student_courses")
      .select("*")
      .eq("user_id", userId)
      .eq("course_number", courseNumber)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking tutor student course:", checkError);
      throw checkError;
    }

    if (existingCourse) {
      // Course already exists, no need to add it again
      return { success: true, course: existingCourse };
    }

    // Get course details
    const courseDetails = await fetchCourseDetails(courseNumber);

    // Add to tutor_student_courses table
    const { data: newCourse, error: insertError } = await supabase
      .from("tutor_student_courses")
      .insert({
        user_id: userId,
        course_number: courseNumber,
        course_title: courseDetails?.course_title || "",
        department: courseNumber.split('-')[0] || null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Failed to add tutor student course:", insertError);
      throw insertError;
    }

    return { success: true, course: newCourse };
  } catch (error) {
    console.error("Error in addTutorStudentCourse:", error);
    throw error;
  }
}

/**
 * Remove a course from a tutor's "Courses I Need Help With" list
 */
export async function removeTutorStudentCourse(userId: string, courseNumber: string) {
  try {
    const { error } = await supabase
      .from("tutor_student_courses")
      .delete()
      .eq("user_id", userId)
      .eq("course_number", courseNumber);

    if (error) {
      console.error("Failed to remove tutor student course:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in removeTutorStudentCourse:", error);
    throw error;
  }
}

/**
 * Get all courses that a tutor needs help with
 */
export async function getTutorStudentCourses(userId: string) {
  try {
    const { data, error } = await supabase
      .from("tutor_student_courses")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to get tutor student courses:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTutorStudentCourses:", error);
    return [];
  }
}

// Reuse the existing fetchCourseDetails function from course-utils
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";
