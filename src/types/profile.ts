
export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  avatar_url?: string | null;
  role?: "student" | "tutor";
  bio?: string | null;
  hourly_rate?: number | null;
  average_rating?: number | null;
  stripe_connect_id?: string | null;
  stripe_connect_onboarding_complete?: boolean;
  subjects?: string[];
  availability?: any; // Using any for now, but could be more specific
  created_at?: string;
  updated_at?: string;
}
