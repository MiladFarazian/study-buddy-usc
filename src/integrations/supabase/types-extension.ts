
import { Database } from "./types";

// Define the Profile type based on the database schema
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Define the Review type
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

// Define a custom Course type 
export type Course = {
  id: string;
  course_number: string;
  course_title: string;
  instructor: string | null;
  department: string;
  description?: string | null;
};

// Define the TutorCourse type
export type TutorCourse = Database["public"]["Tables"]["tutor_courses"]["Row"];
export type TutorCourseInsert = Database["public"]["Tables"]["tutor_courses"]["Insert"];
export type TutorCourseUpdate = Database["public"]["Tables"]["tutor_courses"]["Update"];

// Define the TutorStudentCourse type for courses tutors need help with
export type TutorStudentCourse = {
  id: string;
  user_id: string;
  course_number: string;
  course_title: string | null;
  department: string | null;
  created_at?: string;
};

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

// Define the course term-specific tables
export type Spring2025Course = Database["public"]["Tables"]["courses-20251"]["Row"];
export type Summer2025Course = Database["public"]["Tables"]["courses-20252"]["Row"];
export type Fall2025Course = Database["public"]["Tables"]["courses-20253"]["Row"];

// Define messaging types
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
export type ConversationUpdate = Database["public"]["Tables"]["conversations"]["Update"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

// Extended conversation type with participant profile data
export type ConversationWithProfiles = Conversation & {
  tutor: Profile;
  student: Profile;
  unread_count?: number;
};
