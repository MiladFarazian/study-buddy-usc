
import { useState, useEffect } from "react";
import { TutorStudentCourse } from "@/integrations/supabase/types-extension";
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";
import { useAuth } from "@/contexts/AuthContext";

export function useTutorStudentCourses() {
  const [courses, setCourses] = useState<TutorStudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
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
        const data = await getTutorStudentCourses(user.id);
        setCourses(data);
      } catch (error) {
        console.error("Error fetching tutor student courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return { courses, loading };
}

export default useTutorStudentCourses;
