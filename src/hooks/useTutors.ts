
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tutor, Subject } from "@/types/tutor";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorStudentCourses } from "@/lib/tutor-student-utils";
import { findMatchingTutorsWithInstructor, MatchResult } from "@/lib/instructor-matching-utils";

// Department code to friendly name mapping
const DEPARTMENT_NAMES: Record<string, string> = {
  'CSCI': 'Computer Science',
  'ECON': 'Economics',
  'FBE': 'Business & Finance',
  'BUAD': 'Business Administration',
  'ACCT': 'Accounting',
  'BAEP': 'Business Entrepreneurship',
  'AME': 'Mechanical Engineering',
  'EE': 'Electrical Engineering',
  'CE': 'Civil Engineering',
  'GEOL': 'Geology',
  'CHEM': 'Chemistry',
  'BISC': 'Biological Sciences',
  'PHYS': 'Physics',
  'MATH': 'Mathematics',
  'WRIT': 'Writing',
  'ENGL': 'English',
  'HIST': 'History',
  'PSYC': 'Psychology',
  'SOCI': 'Sociology',
  'ANTH': 'Anthropology',
  'POIR': 'Political Science',
};

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, user } = useAuth();

  const [studentCourseTutors, setStudentCourseTutors] = useState<Tutor[]>([]);
  const [loadingStudentTutors, setLoadingStudentTutors] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [departments, setDepartments] = useState<Array<{ code: string; name: string }>>([]);

  // Function to extract course numbers from student profile or tutor's "need help with" courses
  const getStudentCourses = async (): Promise<string[]> => {
    if (!profile) return [];
    
    if (!profile.approved_tutor && profile.student_courses && Array.isArray(profile.student_courses)) {
      return profile.student_courses;
    }
    
    // If user is a tutor, fetch courses they need help with
    if (profile.approved_tutor && user) {
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
        // Fetch tutors from the new tutors table with public profile data (only approved)
        const { data: tutorData, error } = await supabase
          .from('tutors')
          .select(`
            *,
            public_tutor_profiles!profile_id (
              first_name,
              last_name,
              major,
              graduation_year,
              avatar_url,
              tutor_courses_subjects,
              approved_tutor,
              available_in_person,
              available_online
            )
          `)
          .eq('approved_tutor', true)
          .order('average_rating', { ascending: false }); // Order by rating so best tutors show first

        if (error) {
          console.error("Error fetching tutors:", error);
          setError(error.message);
          setTutors([]);
          setLoading(false);
          return;
        }

        // If no tutors found, just set empty array
        if (!tutorData || tutorData.length === 0) {
          setTutors([]);
          setLoading(false);
          return;
        }

        

        // Process tutors to create tutor objects
        const processedTutors = tutorData.map(tutor => {
          const profile = tutor.public_tutor_profiles;
          
          // Get subjects from tutor_courses_subjects field
          const subjects: Subject[] = profile?.tutor_courses_subjects && Array.isArray(profile.tutor_courses_subjects) && profile.tutor_courses_subjects.length > 0 
            ? profile.tutor_courses_subjects.map((courseCode: string) => ({
                code: courseCode,
                name: courseCode
              }))
            : [];

          // Use first_name and last_name from tutors table if available, fallback to profiles
          const firstName = tutor.first_name || profile?.first_name || '';
          const lastName = tutor.last_name || profile?.last_name || '';

          // Create tutor object from real data
          return {
            id: tutor.profile_id,
            name: `${firstName} ${lastName}`.trim() || 'USC Tutor',
            firstName: firstName,
            lastName: lastName,
            field: profile?.major || 'USC Student',
            rating: tutor.average_rating || 0,
            hourlyRate: tutor.hourly_rate || 0,
            subjects: subjects,
            imageUrl: profile?.avatar_url || '',
            bio: tutor.bio || '',
            graduationYear: profile?.graduation_year || '',
            available_in_person: profile?.available_in_person,
            available_online: profile?.available_online
          };
        });

        setTutors(processedTutors);
        
        // Extract unique departments from all tutors
        const departmentSet = new Set<string>();
        processedTutors.forEach(tutor => {
          tutor.subjects.forEach(subject => {
            // Extract department code (everything before the dash or number)
            const deptMatch = subject.code.match(/^([A-Z]+)/);
            if (deptMatch) {
              departmentSet.add(deptMatch[1]);
            }
          });
        });
        
        // Convert to array with friendly names, sorted alphabetically
        const deptArray = Array.from(departmentSet)
          .map(code => ({
            code,
            name: DEPARTMENT_NAMES[code] || code
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setDepartments(deptArray);
        
        // If profile exists, find matching tutors with instructor-based matching
        if (profile && user?.id) {
          setLoadingStudentTutors(true);
          
          // Use new instructor-based matching
          const instructorMatches = await findMatchingTutorsWithInstructor(user.id);
          setMatchResults(instructorMatches);
          
          // Filter tutors to only include those with matches, sorted by match score
          const matchedTutorIds = new Set(instructorMatches.map(m => m.tutorId));
          const matchingTutors = processedTutors
            .filter(t => matchedTutorIds.has(t.id))
            .sort((a, b) => {
              const matchA = instructorMatches.find(m => m.tutorId === a.id);
              const matchB = instructorMatches.find(m => m.tutorId === b.id);
              return (matchB?.matchScore || 0) - (matchA?.matchScore || 0);
            });
          
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
    loadingStudentTutors,
    matchResults,
    departments 
  };
}
