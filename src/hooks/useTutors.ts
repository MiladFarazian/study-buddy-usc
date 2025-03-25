
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
        // Fetch tutors
        const { data: tutorProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tutor');

        if (error) {
          throw error;
        }

        // Fetch tutor courses
        const tutorsWithCourses = await Promise.all(
          tutorProfiles.map(async (profile) => {
            // Fetch tutor courses
            const { data: tutorCourses, error: coursesError } = await supabase
              .from('tutor_courses')
              .select('*')
              .eq('tutor_id', profile.id);

            if (coursesError) {
              console.error("Error fetching tutor courses:", coursesError);
              return null;
            }

            // Convert to subjects format
            const subjects: Subject[] = tutorCourses?.map(course => ({
              code: course.course_number,
              name: course.course_title || course.course_number
            })) || [];

            // If the profile has subjects array but no tutor_courses
            if ((!subjects || subjects.length === 0) && profile.subjects && profile.subjects.length > 0) {
              // Use subjects from profile
              profile.subjects.forEach(courseCode => {
                subjects.push({
                  code: courseCode,
                  name: courseCode
                });
              });
            }

            // Create tutor object
            return {
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              field: profile.major || 'USC Student',
              rating: profile.average_rating || 4.5,
              hourlyRate: profile.hourly_rate || 25,
              subjects: subjects,
              imageUrl: profile.avatar_url || '',
              bio: profile.bio || '',
              graduationYear: profile.graduation_year || ''
            };
          })
        );

        // Filter out null values and set tutors
        setTutors(tutorsWithCourses.filter(Boolean) as Tutor[]);
      } catch (error) {
        console.error("Error fetching tutors:", error);
        setTutors([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return { tutors, loading };
}
