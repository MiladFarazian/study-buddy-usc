
export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string | null;
  term_code?: string;
  instructor?: string;
  units?: string;
  days?: string;
  time?: string;
  location?: string;
  session_type?: string;
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
