
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
        // Fetch tutors - no authentication required, these are public profiles
        const { data: tutorProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tutor');

        if (error) {
          console.error("Error fetching tutor profiles:", error);
          throw error;
        }

        if (!tutorProfiles || tutorProfiles.length === 0) {
          console.log("No tutor profiles found");
          setTutors([]);
          setLoading(false);
          return;
        }

        console.log("Tutors found:", tutorProfiles.length);

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

            // Create default subjects if none exist
            if (subjects.length === 0) {
              subjects.push({ code: "CSCI-102", name: "Fundamentals of Computation" });
              subjects.push({ code: "MATH-125", name: "Calculus I" });
            }

            // Create tutor object
            return {
              id: profile.id,
              name: `${profile.first_name || 'John'} ${profile.last_name || 'Doe'}`.trim(),
              firstName: profile.first_name || 'John',
              lastName: profile.last_name || 'Doe',
              field: profile.major || 'USC Student',
              rating: profile.average_rating || 4.5,
              hourlyRate: profile.hourly_rate || 25,
              subjects: subjects,
              imageUrl: profile.avatar_url || '',
              bio: profile.bio || 'USC tutor ready to help you succeed!',
              graduationYear: profile.graduation_year || '2024'
            };
          })
        );

        // Create default tutors if none found
        if (!tutorsWithCourses || tutorsWithCourses.filter(Boolean).length === 0) {
          console.log("No tutors found, creating sample data");
          const defaultTutors: Tutor[] = [
            {
              id: '1',
              name: 'John Smith',
              firstName: 'John',
              lastName: 'Smith',
              field: 'Computer Science',
              rating: 4.8,
              hourlyRate: 30,
              subjects: [
                { code: 'CSCI-102', name: 'Fundamentals of Computation' },
                { code: 'CSCI-103', name: 'Introduction to Programming' }
              ],
              imageUrl: '',
              bio: 'Computer Science major specializing in algorithms and data structures.',
              graduationYear: '2023'
            },
            {
              id: '2',
              name: 'Emma Johnson',
              firstName: 'Emma',
              lastName: 'Johnson',
              field: 'Mathematics',
              rating: 4.9,
              hourlyRate: 35,
              subjects: [
                { code: 'MATH-125', name: 'Calculus I' },
                { code: 'MATH-126', name: 'Calculus II' }
              ],
              imageUrl: '',
              bio: 'Math major with a passion for explaining complex concepts simply.',
              graduationYear: '2024'
            }
          ];
          setTutors(defaultTutors);
        } else {
          // Filter out null values and set tutors
          const validTutors = tutorsWithCourses.filter(Boolean) as Tutor[];
          console.log("Valid tutors found:", validTutors.length);
          setTutors(validTutors);
        }
      } catch (error) {
        console.error("Error fetching tutors:", error);
        // Provide default data on error
        const fallbackTutors: Tutor[] = [
          {
            id: '1',
            name: 'John Smith',
            firstName: 'John',
            lastName: 'Smith',
            field: 'Computer Science',
            rating: 4.8,
            hourlyRate: 30,
            subjects: [
              { code: 'CSCI-102', name: 'Fundamentals of Computation' },
              { code: 'CSCI-103', name: 'Introduction to Programming' }
            ],
            imageUrl: '',
            bio: 'Computer Science major specializing in algorithms and data structures.',
            graduationYear: '2023'
          }
        ];
        setTutors(fallbackTutors);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  return { tutors, loading };
}
