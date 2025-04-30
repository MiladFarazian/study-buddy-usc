
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";
import { Course } from "@/types/CourseTypes";

export function useTutorStudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) {
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const coursesData = await getTutorStudentCourses(user.id);
        
        const formattedCourses = coursesData.map((course: any) => ({
          id: course.id,
          course_number: course.course_number,
          course_title: course.course_title || "",
          instructor: null,
          department: course.department || course.course_number?.split('-')[0] || "",
        }));
        
        setCourses(formattedCourses);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tutor student courses");
        console.error("Error fetching tutor student courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return { courses, loading, error };
}
