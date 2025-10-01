
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

/**
 * Add a course to a user's profile based on their role
 */
export async function addCourseToProfile(userId: string, courseNumber: string, instructor?: string) {
  // First get current profile data
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, tutor_courses_subjects, student_courses")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  let updateData: any = {};

  if (profile?.role === "tutor") {
    // For tutors, add to tutor_courses_subjects array
    const updatedSubjects = [...(profile?.tutor_courses_subjects || [])];
    if (!updatedSubjects.includes(courseNumber)) {
      updatedSubjects.push(courseNumber);
    }
    updateData.tutor_courses_subjects = updatedSubjects;

    // Also add to tutor_courses table
    const courseDetails = await fetchCourseDetails(courseNumber);
    const { error: tutorCourseError } = await supabase
      .from("tutor_courses")
      .upsert({
        tutor_id: userId,
        course_number: courseNumber,
        course_title: courseDetails?.course_title || "",
        department: courseNumber.split('-')[0] || null,
        instructor: instructor || null,
      });

    if (tutorCourseError) {
      console.error("Failed to add to tutor_courses:", tutorCourseError);
      // Continue anyway as the main profile update worked
    }
  } else {
    // For students, add to student_courses array
    const updatedSubjects = [...(profile?.student_courses || [])];
    if (!updatedSubjects.includes(courseNumber)) {
      updatedSubjects.push(courseNumber);
    }
    updateData.student_courses = updatedSubjects;
  }

  // Update the profile with the role-specific array
  const { error: profileError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  return { success: true };
}

/**
 * Remove a course from a user's profile based on their role
 */
export async function removeCourseFromProfile(userId: string, courseNumber: string) {
  // First get current profile data
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, tutor_courses_subjects, student_courses")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  let updateData: any = {};

  if (profile?.role === "tutor") {
    // For tutors, remove from tutor_courses_subjects array
    const updatedSubjects = (profile?.tutor_courses_subjects || []).filter(
      (subject) => subject !== courseNumber
    );
    updateData.tutor_courses_subjects = updatedSubjects;

    // Also remove from tutor_courses table
    const { error: tutorCourseError } = await supabase
      .from("tutor_courses")
      .delete()
      .eq("tutor_id", userId)
      .eq("course_number", courseNumber);

    if (tutorCourseError) {
      console.error("Failed to remove from tutor_courses:", tutorCourseError);
      // Continue anyway as the main profile update worked
    }
  } else {
    // For students, remove from student_courses array
    const updatedSubjects = (profile?.student_courses || []).filter(
      (subject) => subject !== courseNumber
    );
    updateData.student_courses = updatedSubjects;
  }

  // Update the profile with the role-specific array
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return { success: true };
}

/**
 * Get all courses for a specific tutor
 */
export async function getTutorCourses(tutorId: string): Promise<Course[]> {
  console.log("[getTutorCourses] Fetching courses for tutor:", tutorId);
  
  if (!tutorId) {
    console.log("[getTutorCourses] No tutor ID provided, returning empty array");
    return [];
  }

  try {
    // Get courses the tutor has selected
    const { data: tutorCourses, error: tutorCoursesError } = await supabase
      .from("tutor_courses")
      .select("course_number, course_title, department")
      .eq("tutor_id", tutorId);

    if (tutorCoursesError) {
      console.error("[getTutorCourses] Error fetching tutor courses:", tutorCoursesError);
      throw tutorCoursesError;
    }

    console.log(`[getTutorCourses] Found ${tutorCourses?.length || 0} courses for tutor:`, tutorCourses);

    // If no courses are found, return empty array
    if (!tutorCourses || tutorCourses.length === 0) {
      return [];
    }

    // Transform tutor courses to our standard Course type
    const coursesWithDetails: Course[] = await Promise.all(
      tutorCourses.map(async (tutorCourse) => {
        console.log(`[getTutorCourses] Processing course: ${tutorCourse.course_number}`);
        
        // Try to get additional details if available
        let courseDetails = null;
        if (tutorCourse.course_number) {
          courseDetails = await fetchCourseDetails(tutorCourse.course_number);
        }

        return {
          id: tutorCourse.course_number || crypto.randomUUID(),
          course_number: tutorCourse.course_number || "",
          course_title: tutorCourse.course_title || courseDetails?.course_title || "",
          instructor: null,
          department: tutorCourse.department || tutorCourse.course_number?.split('-')[0] || "",
        };
      })
    );

    console.log("[getTutorCourses] Processed courses with details:", coursesWithDetails);
    return coursesWithDetails;
  } catch (error) {
    console.error("[getTutorCourses] Error fetching tutor courses:", error);
    return [];
  }
}
