
export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  avatar_url?: string | null;
  role?: "student" | "tutor";
  bio?: string | null;
  student_bio?: string | null;
  tutor_bio?: string | null;
  hourly_rate?: number | null;
  average_rating?: number | null;
  stripe_connect_id?: string | null;
  stripe_connect_onboarding_complete?: boolean;
  subjects?: string[];
  student_courses?: string[];
  tutor_courses_subjects?: string[];
  availability?: any; // Using any for now, but could be more specific
  created_at?: string;
  updated_at?: string;
  approved_tutor?: boolean; // Added this property to fix TypeScript errors
}
