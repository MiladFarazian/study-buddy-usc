
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/CourseTypes";
import { fetchCourseDetails } from "@/lib/scheduling/course-utils";

export function useTutorCourses(tutorId: string | undefined) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorId) {
      console.log("No tutor ID provided to useTutorCourses hook");
      setCourses([]);
      setLoading(false);
      return;
    }

    async function fetchTutorCourses() {
      setLoading(true);
      setError(null);

      try {
        console.log(`[useTutorCourses] Fetching courses for tutor ID: ${tutorId}`);
        
        // Get courses the tutor has selected
        const { data: tutorCourses, error: tutorCoursesError } = await supabase
          .from("tutor_courses")
          .select("course_number, course_title, department")
          .eq("tutor_id", tutorId);

        if (tutorCoursesError) {
          console.error("[useTutorCourses] Error fetching tutor courses:", tutorCoursesError);
          throw tutorCoursesError;
        }

        console.log(`[useTutorCourses] Found ${tutorCourses?.length || 0} courses for tutor:`, tutorCourses);
        
        // If no courses are found, return empty array
        if (!tutorCourses || tutorCourses.length === 0) {
          console.log("[useTutorCourses] No courses found for tutor, returning empty array");
          setCourses([]);
          setLoading(false);
          return;
        }

        // Transform tutor courses to our standard Course type
        const coursesWithDetails: Course[] = await Promise.all(
          tutorCourses.map(async (tutorCourse) => {
            console.log(`[useTutorCourses] Processing course: ${tutorCourse.course_number}`);
            
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

        console.log("[useTutorCourses] Processed courses with details:", coursesWithDetails);
        setCourses(coursesWithDetails);
      } catch (err: any) {
        console.error("[useTutorCourses] Error fetching tutor courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchTutorCourses();
  }, [tutorId]);

  return { courses, loading, error };
}
