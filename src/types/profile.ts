
export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  avatar_url?: string | null;
  role?: string;
  bio?: string | null;
  hourly_rate?: number | null;
  average_rating?: number | null;
  stripe_connect_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
