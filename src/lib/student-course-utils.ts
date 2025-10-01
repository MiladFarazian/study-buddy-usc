import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

/**
 * Get all courses for a specific student from student_courses table
 */
export async function getStudentCourses(studentId: string): Promise<Course[]> {
  console.log("[getStudentCourses] Fetching courses for student:", studentId);
  
  if (!studentId) {
    console.log("[getStudentCourses] No student ID provided, returning empty array");
    return [];
  }

  try {
    // Get courses the student has selected
    const { data: studentCourses, error: studentCoursesError } = await supabase
      .from("student_courses")
      .select("course_number, course_title, department")
      .eq("student_id", studentId);

    if (studentCoursesError) {
      console.error("[getStudentCourses] Error fetching student courses:", studentCoursesError);
      throw studentCoursesError;
    }

    console.log(`[getStudentCourses] Found ${studentCourses?.length || 0} courses for student:`, studentCourses);

    // If no courses are found, return empty array
    if (!studentCourses || studentCourses.length === 0) {
      return [];
    }

    // Transform student courses to our standard Course type
    const coursesWithDetails: Course[] = await Promise.all(
      studentCourses.map(async (studentCourse) => {
        console.log(`[getStudentCourses] Processing course: ${studentCourse.course_number}`);
        
        // Try to get additional details if available
        let courseDetails = null;
        if (studentCourse.course_number) {
          courseDetails = await fetchCourseDetails(studentCourse.course_number);
        }

        return {
          id: studentCourse.course_number || crypto.randomUUID(),
          course_number: studentCourse.course_number || "",
          course_title: studentCourse.course_title || courseDetails?.course_title || "",
          instructor: null,
          department: studentCourse.department || studentCourse.course_number?.split('-')[0] || "",
        };
      })
    );

    console.log("[getStudentCourses] Processed courses with details:", coursesWithDetails);
    return coursesWithDetails;
  } catch (error) {
    console.error("[getStudentCourses] Error fetching student courses:", error);
    return [];
  }
}
