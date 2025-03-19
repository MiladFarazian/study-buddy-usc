
import { Database } from "./types";

// Define the Profile type based on the database schema
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Define the Review type
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Define a custom Course type (since the table structure has changed)
export type Course = {
  id: string;
  code: string;
  name: string;
  term_code: string;
  instructor: string;
  department: string;
  description?: string | null;
  session_type: string;
  units: string;
  days: string;
  time: string;
  location: string;
};
export type CourseInsert = {
  id?: string;
  code: string;
  name: string;
  term_code: string;
  instructor?: string;
  department: string;
  description?: string | null;
  session_type?: string;
  units?: string;
  days?: string;
  time?: string;
  location?: string;
};
export type CourseUpdate = {
  id?: string;
  code?: string;
  name?: string;
  term_code?: string;
  instructor?: string;
  department?: string;
  description?: string | null;
  session_type?: string;
  units?: string;
  days?: string;
  time?: string;
  location?: string;
};

// Define the TutorCourse type
export type TutorCourse = Database["public"]["Tables"]["tutor_courses"]["Row"];
export type TutorCourseInsert = Database["public"]["Tables"]["tutor_courses"]["Insert"];
export type TutorCourseUpdate = Database["public"]["Tables"]["tutor_courses"]["Update"];

// Define the Session type
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

// Define the Term type
export type Term = {
  id: string;
  code: string;
  name: string;
  is_current: boolean;
  created_at?: string;
};

// Define the Fall2025 course type
export type Fall2025Course = Database["public"]["Tables"]["courses-20253"]["Row"];
export type Fall2025CourseInsert = Database["public"]["Tables"]["courses-20253"]["Insert"];
export type Fall2025CourseUpdate = Database["public"]["Tables"]["courses-20253"]["Update"];
