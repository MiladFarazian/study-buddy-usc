
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
      setCourses([]);
      setLoading(false);
      return;
    }

    async function fetchTutorCourses() {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching courses for tutor: ${tutorId}`);
        // Get courses the tutor has selected
        const { data: tutorCourses, error: tutorCoursesError } = await supabase
          .from("tutor_courses")
          .select("course_number, course_title, department")
          .eq("tutor_id", tutorId);

        if (tutorCoursesError) {
          throw tutorCoursesError;
        }

        console.log(`Found ${tutorCourses?.length || 0} courses for tutor`);
        
        // If no courses are found, return empty array
        if (!tutorCourses || tutorCourses.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Transform tutor courses to our standard Course type
        const coursesWithDetails: Course[] = await Promise.all(
          tutorCourses.map(async (tutorCourse) => {
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

        console.log("Processed courses with details:", coursesWithDetails);
        setCourses(coursesWithDetails);
      } catch (err: any) {
        console.error("Error fetching tutor courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchTutorCourses();
  }, [tutorId]);

  return { courses, loading, error };
}
