import { supabase } from "@/integrations/supabase/client";

export interface CourseMatch {
  course_number: string;
  course_title: string | null;
  instructor: string | null;
  department: string | null;
}

export interface MatchResult {
  tutorId: string;
  exactMatches: CourseMatch[]; // Same course + same instructor
  courseOnlyMatches: CourseMatch[]; // Same course, different or no instructor
  matchScore: number;
}

export type MatchType = 'exact' | 'course-only' | 'none';

/**
 * Normalize instructor name for comparison (case-insensitive, trim whitespace)
 */
const normalizeInstructor = (instructor: string | null | undefined): string => {
  if (!instructor) return '';
  return instructor.toLowerCase().trim();
};

/**
 * Compare two instructor names to determine if they match
 */
const instructorsMatch = (instructor1: string | null | undefined, instructor2: string | null | undefined): boolean => {
  const norm1 = normalizeInstructor(instructor1);
  const norm2 = normalizeInstructor(instructor2);
  
  // Both empty = no instructor info to match on
  if (!norm1 || !norm2) return false;
  
  return norm1 === norm2;
};

/**
 * Fetch student courses with instructor information
 */
export async function getStudentCoursesWithInstructor(studentId: string): Promise<CourseMatch[]> {
  const { data, error } = await supabase
    .from("student_courses")
    .select("course_number, course_title, instructor, department")
    .eq("student_id", studentId);

  if (error) {
    console.error("[getStudentCoursesWithInstructor] Error:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch tutor courses with instructor information
 */
export async function getTutorCoursesWithInstructor(tutorId: string): Promise<CourseMatch[]> {
  const { data, error } = await supabase
    .from("tutor_courses")
    .select("course_number, course_title, instructor, department")
    .eq("tutor_id", tutorId);

  if (error) {
    console.error("[getTutorCoursesWithInstructor] Error:", error);
    return [];
  }

  return data || [];
}

/**
 * Calculate match between student courses and tutor courses
 * Prioritizes exact matches (course + instructor) over course-only matches
 */
export function calculateCourseMatch(
  studentCourses: CourseMatch[],
  tutorCourses: CourseMatch[]
): {
  exactMatches: CourseMatch[];
  courseOnlyMatches: CourseMatch[];
  matchScore: number;
} {
  const exactMatches: CourseMatch[] = [];
  const courseOnlyMatches: CourseMatch[] = [];

  for (const studentCourse of studentCourses) {
    for (const tutorCourse of tutorCourses) {
      // Check if course numbers match
      if (studentCourse.course_number === tutorCourse.course_number) {
        // Check if instructors also match
        if (instructorsMatch(studentCourse.instructor, tutorCourse.instructor)) {
          exactMatches.push({
            course_number: studentCourse.course_number,
            course_title: studentCourse.course_title || tutorCourse.course_title,
            instructor: studentCourse.instructor,
            department: studentCourse.department || tutorCourse.department,
          });
        } else {
          // Course matches but not instructor
          courseOnlyMatches.push({
            course_number: studentCourse.course_number,
            course_title: studentCourse.course_title || tutorCourse.course_title,
            instructor: tutorCourse.instructor,
            department: studentCourse.department || tutorCourse.department,
          });
        }
      }
    }
  }

  // Calculate match score: exact matches worth 100 points, course-only worth 50 points
  const matchScore = (exactMatches.length * 100) + (courseOnlyMatches.length * 50);

  return { exactMatches, courseOnlyMatches, matchScore };
}

/**
 * Get match type for a specific course between student and tutor
 */
export function getCourseMatchType(
  courseNumber: string,
  studentCourses: CourseMatch[],
  tutorCourses: CourseMatch[]
): MatchType {
  const studentCourse = studentCourses.find(c => c.course_number === courseNumber);
  const tutorCourse = tutorCourses.find(c => c.course_number === courseNumber);

  if (!studentCourse || !tutorCourse) return 'none';

  if (instructorsMatch(studentCourse.instructor, tutorCourse.instructor)) {
    return 'exact';
  }

  return 'course-only';
}

/**
 * Find all tutors and calculate their match scores with a student
 */
export async function findMatchingTutorsWithInstructor(
  studentId: string
): Promise<MatchResult[]> {
  // Fetch student courses
  const studentCourses = await getStudentCoursesWithInstructor(studentId);
  
  if (studentCourses.length === 0) {
    return [];
  }

  // Fetch all approved tutors
  const { data: tutors, error } = await supabase
    .from("tutors")
    .select("profile_id")
    .eq("approved_tutor", true);

  if (error || !tutors) {
    console.error("[findMatchingTutorsWithInstructor] Error fetching tutors:", error);
    return [];
  }

  // Calculate matches for each tutor
  const matchResults: MatchResult[] = [];

  for (const tutor of tutors) {
    const tutorCourses = await getTutorCoursesWithInstructor(tutor.profile_id);
    const { exactMatches, courseOnlyMatches, matchScore } = calculateCourseMatch(
      studentCourses,
      tutorCourses
    );

    // Only include tutors with at least one match
    if (matchScore > 0) {
      matchResults.push({
        tutorId: tutor.profile_id,
        exactMatches,
        courseOnlyMatches,
        matchScore,
      });
    }
  }

  // Sort by match score (descending)
  return matchResults.sort((a, b) => b.matchScore - a.matchScore);
}
