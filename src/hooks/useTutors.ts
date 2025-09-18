
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();

  const [studentCourseTutors, setStudentCourseTutors] = useState<Tutor[]>([]);
  const [loadingStudentTutors, setLoadingStudentTutors] = useState(false);

  // Function to extract course numbers from student profile or tutor's "need help with" courses
  const getStudentCourses = async (): Promise<string[]> => {
    if (!profile) return [];
    
    if (profile.role === 'student' && profile.student_courses && Array.isArray(profile.student_courses)) {
      return profile.student_courses;
    }
    
    // If user is a tutor, fetch courses they need help with
    if (profile.role === 'tutor' && user) {
      try {
        const tutorStudentCourses = await getTutorStudentCourses(user.id);
        return tutorStudentCourses.map((course: any) => course.course_number);
      } catch (err) {
        console.error("Error fetching tutor student courses:", err);
      }
    }
    
    return [];
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
          // Get subjects from tutor_courses_subjects field for tutors
          const subjects: Subject[] = profile.tutor_courses_subjects && Array.isArray(profile.tutor_courses_subjects) && profile.tutor_courses_subjects.length > 0 
            ? profile.tutor_courses_subjects.map((courseCode: string) => ({
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
        
        // If profile exists, find matching tutors
        if (profile) {
          setLoadingStudentTutors(true);
          const studentCourses = await getStudentCourses();
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
  }, [profile, user?.id]);

  return { 
    tutors, 
    loading, 
    error, 
    studentCourseTutors, 
    loadingStudentTutors 
  };
}
