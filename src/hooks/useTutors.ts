
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";
import { useAuth } from "@/contexts/AuthContext";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const [studentCourseTutors, setStudentCourseTutors] = useState<Tutor[]>([]);
  const [loadingStudentTutors, setLoadingStudentTutors] = useState(false);

  // Function to extract course numbers from student profile
  const getStudentCourses = (): string[] => {
    if (!profile || !profile.subjects || !Array.isArray(profile.subjects)) {
      return [];
    }
    return profile.subjects;
  };

  // Function to find tutors who match student courses
  const findMatchingTutors = (allTutors: Tutor[], studentCourses: string[]): Tutor[] => {
    if (!studentCourses.length) return [];
    
    // Map tutors with their matching course count
    const tutorsWithMatches = allTutors.map(tutor => {
      const matchingCourseCount = tutor.subjects.filter(subject => 
        studentCourses.includes(subject.code)
      ).length;
      
      return { tutor, matchingCourseCount };
    });
    
    // Filter tutors who have at least one matching course
    const matching = tutorsWithMatches
      .filter(item => item.matchingCourseCount > 0)
      // Sort by matching count first, then by rating
      .sort((a, b) => {
        if (b.matchingCourseCount !== a.matchingCourseCount) {
          return b.matchingCourseCount - a.matchingCourseCount;
        }
        return b.tutor.rating - a.tutor.rating;
      })
      .map(item => item.tutor);
      
    return matching;
  };

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching tutor profiles...");
        // Fetch tutors - public access enabled via RLS policy
        const { data: tutorProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tutor')
          .order('average_rating', { ascending: false }); // Order by rating so best tutors show first

        if (error) {
          console.error("Error fetching tutor profiles:", error);
          setError(error.message);
          setTutors([]);
          setLoading(false);
          return;
        }

        // If no tutors found, just set empty array
        if (!tutorProfiles || tutorProfiles.length === 0) {
          console.log("No tutor profiles found");
          setTutors([]);
          setLoading(false);
          return;
        }

        console.log("Tutors found:", tutorProfiles.length);

        // Process tutor profiles to create tutor objects
        const processedTutors = tutorProfiles.map(profile => {
          // Get subjects from profile if available
          const subjects: Subject[] = profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0 
            ? profile.subjects.map((courseCode: string) => ({
                code: courseCode,
                name: courseCode
              }))
            : [];

          // Create tutor object from real data
          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'USC Tutor',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            field: profile.major || 'USC Student',
            rating: profile.average_rating || 0,
            hourlyRate: profile.hourly_rate || 0,
            subjects: subjects,
            imageUrl: profile.avatar_url || '',
            bio: profile.bio || '',
            graduationYear: profile.graduation_year || ''
          };
        });

        setTutors(processedTutors);
        
        // If student profile exists, find matching tutors
        if (profile && profile.role === 'student') {
          setLoadingStudentTutors(true);
          const studentCourses = getStudentCourses();
          const matchingTutors = findMatchingTutors(processedTutors, studentCourses);
          setStudentCourseTutors(matchingTutors);
          setLoadingStudentTutors(false);
        }

      } catch (error: any) {
        console.error("Error fetching tutors:", error);
        setError(error.message || "Failed to fetch tutors");
        setTutors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [profile]);

  return { 
    tutors, 
    loading, 
    error, 
    studentCourseTutors, 
    loadingStudentTutors 
  };
}
