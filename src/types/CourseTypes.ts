
export interface Course {
  id: string;
  course_number: string;
  course_title: string;
  instructor: string | null;
  department: string;
  description?: string | null;
  // Additional fields used in components
  units?: string | null;
  days?: string | null;
  time?: string | null;
  location?: string | null;
}

export interface Term {
  id: string;
  code: string;
  name: string;
  is_current: boolean;
}

export interface CourseFilterOptions {
  term: string;
  search: string;
  department: string;
}

// Common interface for all term-specific course tables
export interface TermCourse {
  id?: string;
  "Course number": string;
  "Course title": string;
  Instructor: string | null;
  department?: string;
}
