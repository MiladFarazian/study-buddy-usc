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
  // Simple in-memory cache to avoid duplicate work in StrictMode/dev
  // Cache key is studentId since tutor list is global and we recompute on demand
  const now = Date.now();
  const CACHE_TTL = 60 * 1000; // 1 minute
  // @ts-ignore - attach cache to module scope
  if (!(globalThis as any).__matchCache) (globalThis as any).__matchCache = new Map<string, { ts: number; data: MatchResult[] }>();
  const cache: Map<string, { ts: number; data: MatchResult[] }> = (globalThis as any).__matchCache;
  const cached = cache.get(studentId);
  if (cached && now - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  // Fetch student courses
  const studentCourses = await getStudentCoursesWithInstructor(studentId);
  if (studentCourses.length === 0) {
    cache.set(studentId, { ts: now, data: [] });
    return [];
  }

  // Fetch all approved tutors (ids only)
  const { data: tutors, error } = await supabase
    .from("tutors")
    .select("profile_id")
    .eq("approved_tutor", true);

  if (error || !tutors || tutors.length === 0) {
    console.error("[findMatchingTutorsWithInstructor] Error fetching tutors:", error);
    cache.set(studentId, { ts: now, data: [] });
    return [];
  }

  const tutorIds = tutors.map(t => t.profile_id);

  // Batch-fetch all tutor courses in a single query instead of N+1
  const { data: tutorCoursesRows, error: tutorCoursesError } = await supabase
    .from("tutor_courses")
    .select("tutor_id, course_number, course_title, instructor, department")
    .in("tutor_id", tutorIds);

  if (tutorCoursesError) {
    console.error("[findMatchingTutorsWithInstructor] Error fetching tutor courses:", tutorCoursesError);
    cache.set(studentId, { ts: now, data: [] });
    return [];
  }

  // Group tutor courses by tutor_id
  const tutorCoursesMap = new Map<string, CourseMatch[]>();
  for (const row of tutorCoursesRows || []) {
    const arr = tutorCoursesMap.get(row.tutor_id) || [];
    arr.push({
      course_number: row.course_number,
      course_title: row.course_title,
      instructor: row.instructor,
      department: row.department,
    });
    tutorCoursesMap.set(row.tutor_id, arr);
  }

  // Calculate matches for each tutor
  const matchResults: MatchResult[] = [];
  for (const tutorId of tutorIds) {
    const tutorCourses: CourseMatch[] = tutorCoursesMap.get(tutorId) ?? [];
    const { exactMatches, courseOnlyMatches, matchScore } = calculateCourseMatch(
      studentCourses,
      tutorCourses
    );

    if (matchScore > 0) {
      matchResults.push({
        tutorId,
        exactMatches,
        courseOnlyMatches,
        matchScore,
      });
    }
  }

  const sorted = matchResults.sort((a, b) => b.matchScore - a.matchScore);
  cache.set(studentId, { ts: now, data: sorted });
  return sorted;
}
