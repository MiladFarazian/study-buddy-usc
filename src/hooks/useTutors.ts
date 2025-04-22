
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
          // Don't throw error, instead provide fallback data
        }

        // Create default tutors if none found or error occurred
        if (!tutorProfiles || tutorProfiles.length === 0) {
          console.log("No tutor profiles found, using sample data");
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
            },
            {
              id: '3',
              name: 'Michael Chen',
              firstName: 'Michael',
              lastName: 'Chen',
              field: 'Biology',
              rating: 4.7,
              hourlyRate: 28,
              subjects: [
                { code: 'BISC-120', name: 'General Biology' },
                { code: 'BISC-220', name: 'Cell Biology' }
              ],
              imageUrl: '',
              bio: 'Biology major with research experience in molecular biology.',
              graduationYear: '2023'
            }
          ];
          setTutors(defaultTutors);
          setLoading(false);
          return;
        }

        console.log("Tutors found:", tutorProfiles.length);

        // Process tutor profiles to create tutor objects
        const processedTutors = tutorProfiles.map(profile => {
          // Create default subjects if none exist
          const defaultSubjects: Subject[] = [
            { code: "CSCI-102", name: "Fundamentals of Computation" },
            { code: "MATH-125", name: "Calculus I" }
          ];
          
          // Use subjects from profile if available
          const subjects: Subject[] = profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 
            ? profile.subjects.map((courseCode: string) => ({
                code: courseCode,
                name: courseCode
              }))
            : defaultSubjects;

          // Create tutor object
          return {
            id: profile.id,
            name: `${profile.first_name || 'USC'} ${profile.last_name || 'Tutor'}`.trim(),
            firstName: profile.first_name || 'USC',
            lastName: profile.last_name || 'Tutor',
            field: profile.major || 'USC Student',
            rating: profile.average_rating || 4.5,
            hourlyRate: profile.hourly_rate || 25,
            subjects: subjects,
            imageUrl: profile.avatar_url || '',
            bio: profile.bio || 'USC tutor ready to help you succeed!',
            graduationYear: profile.graduation_year || '2024'
          };
        });

        setTutors(processedTutors);

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
