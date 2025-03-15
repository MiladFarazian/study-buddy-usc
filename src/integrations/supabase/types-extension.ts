
import { Database } from "./types";

// Define the Profile type based on the database schema
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Define the Review type
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Define the Course type
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
export type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"];

// Define the TutorCourse type
export type TutorCourse = Database["public"]["Tables"]["tutor_courses"]["Row"];
export type TutorCourseInsert = Database["public"]["Tables"]["tutor_courses"]["Insert"];
export type TutorCourseUpdate = Database["public"]["Tables"]["tutor_courses"]["Update"];

// Define the Session type
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
export type SessionUpdate = Database["public"]["Tables"]["sessions"]["Update"];

// Define the Term type (manually since it's not in the auto-generated types yet)
export type Term = {
  id: string;
  code: string;
  name: string;
  is_current: boolean;
  created_at?: string;
};
