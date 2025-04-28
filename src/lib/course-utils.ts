
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

/**
 * Add a course to a user's profile
 */
export async function addCourseToProfile(userId: string, courseNumber: string) {
  // First get current subjects array
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("subjects")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Add the new course to the subjects array
  const updatedSubjects = [...(profile?.subjects || [])];
  if (!updatedSubjects.includes(courseNumber)) {
    updatedSubjects.push(courseNumber);
  }

  // Update the profile with the new subjects array
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ subjects: updatedSubjects })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  // If user is a tutor, also add to tutor_courses table
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileData?.role === "tutor") {
    // Get course details
    const courseDetails = await fetchCourseDetails(courseNumber);

    // Add to tutor_courses table
    const { error: tutorCourseError } = await supabase
      .from("tutor_courses")
      .upsert({
        tutor_id: userId,
        course_number: courseNumber,
        course_title: courseDetails?.course_title || "",
        department: courseNumber.split('-')[0] || null,
      });

    if (tutorCourseError) {
      console.error("Failed to add to tutor_courses:", tutorCourseError);
      // Continue anyway as the main profile update worked
    }
  }

  return { success: true };
}

/**
 * Remove a course from a user's profile
 */
export async function removeCourseFromProfile(userId: string, courseNumber: string) {
  // First get current subjects array
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("subjects")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Filter out the course to remove
  const updatedSubjects = (profile?.subjects || []).filter(
    (subject) => subject !== courseNumber
  );

  // Update the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ subjects: updatedSubjects })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  // If user is a tutor, also remove from tutor_courses table
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileData?.role === "tutor") {
    const { error: tutorCourseError } = await supabase
      .from("tutor_courses")
      .delete()
      .eq("tutor_id", userId)
      .eq("course_number", courseNumber);

    if (tutorCourseError) {
      console.error("Failed to remove from tutor_courses:", tutorCourseError);
      // Continue anyway as the main profile update worked
    }
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
