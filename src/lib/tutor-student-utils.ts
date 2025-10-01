
import { supabase } from "@/integrations/supabase/client";
import { TutorStudentCourse } from "@/integrations/supabase/types-extension";

/**
 * Add a course to a tutor's "Courses I Need Help With" list
 */
export async function addTutorStudentCourse(userId: string, courseNumber: string) {
  try {
    // First check if this course already exists in the tutor_student_courses table
    const { data: existingCourse, error: checkError } = await supabase
      .from('tutor_student_courses')
      .select()
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
      .from('tutor_student_courses')
      .insert({
        user_id: userId,
        course_number: courseNumber,
        course_title: courseDetails?.course_title || "",
        department: courseNumber.split('-')[0] || null,
      })
      .select()
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
      .from('tutor_student_courses')
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
      .from('tutor_student_courses')
      .select()
      .eq('user_id', userId);

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

/**
 * Get mutual courses between student and a tutor (courses both have selected)
 * @param studentCourses - Courses the student is enrolled in
 * @param tutorId - The tutor's profile ID
 * @returns Array of course codes that both have selected
 */
export async function getMutualCourses(studentCourses: string[], tutorId: string): Promise<string[]> {
  if (!studentCourses || studentCourses.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tutor_student_courses')
      .select('course_number')
      .eq('user_id', tutorId);

    if (error) {
      console.error("Failed to get tutor student courses for mutual check:", error);
      return [];
    }

    const tutorLearningCourses = data?.map(c => c.course_number) || [];
    
    // Return courses that appear in both lists
    return studentCourses.filter(course => tutorLearningCourses.includes(course));
  } catch (error) {
    console.error("Error in getMutualCourses:", error);
    return [];
  }
}

/**
 * Get mutual courses for multiple tutors efficiently
 * @param studentCourses - Courses the student is enrolled in
 * @param tutorIds - Array of tutor profile IDs
 * @returns Map of tutor ID to array of mutual course codes
 */
export async function getMutualCoursesForTutors(
  studentCourses: string[], 
  tutorIds: string[]
): Promise<Map<string, string[]>> {
  const mutualCoursesMap = new Map<string, string[]>();

  if (!studentCourses || studentCourses.length === 0 || !tutorIds || tutorIds.length === 0) {
    return mutualCoursesMap;
  }

  try {
    const { data, error } = await supabase
      .from('tutor_student_courses')
      .select('user_id, course_number')
      .in('user_id', tutorIds);

    if (error) {
      console.error("Failed to get tutor student courses for mutual check:", error);
      return mutualCoursesMap;
    }

    // Group by tutor ID
    const tutorCoursesMap = new Map<string, string[]>();
    data?.forEach(record => {
      if (!tutorCoursesMap.has(record.user_id)) {
        tutorCoursesMap.set(record.user_id, []);
      }
      tutorCoursesMap.get(record.user_id)!.push(record.course_number);
    });

    // Find mutual courses for each tutor
    tutorIds.forEach(tutorId => {
      const tutorCourses = tutorCoursesMap.get(tutorId) || [];
      const mutual = studentCourses.filter(course => tutorCourses.includes(course));
      mutualCoursesMap.set(tutorId, mutual);
    });

    return mutualCoursesMap;
  } catch (error) {
    console.error("Error in getMutualCoursesForTutors:", error);
    return mutualCoursesMap;
  }
}

// Reuse the existing fetchCourseDetails function from course-utils
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";
