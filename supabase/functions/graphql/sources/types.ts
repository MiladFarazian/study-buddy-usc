/**
 * Shared row shapes for the gateway's backing stores.
 *
 * These are deliberately narrow, hand-written subsets of the generated Supabase
 * types: the gateway only reads the columns it exposes, and keeping the list
 * explicit means a `select("*")` never silently leaks a new column through the
 * API.
 */

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  major: string | null;
  graduation_year: string | null;
  bio: string | null;
  student_bio: string | null;
  tutor_bio: string | null;
  role: string;
  approved_tutor: boolean | null;
  average_rating: number | null;
  hourly_rate: number | null;
  available_in_person: boolean | null;
  available_online: boolean | null;
  tutor_courses_subjects: string[] | null;
  student_courses: string[] | null;
  created_at: string;
}

export interface TutorRow {
  id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  hourly_rate: number | null;
  average_rating: number | null;
  subjects: string[] | null;
  max_weekly_sessions: number | null;
  profile_visibility: string;
  approved_tutor: boolean | null;
  stripe_connect_id: string | null;
  stripe_connect_onboarding_complete: boolean | null;
  created_at: string | null;
}

export interface SessionRow {
  id: string;
  tutor_id: string;
  student_id: string;
  course_id: string | null;
  start_time: string;
  end_time: string;
  status: string | null;
  payment_status: string | null;
  session_type: string | null;
  location: string | null;
  notes: string | null;
  zoom_join_url: string | null;
  completion_date: string | null;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  tutor_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface TutorCourseRow {
  id: string;
  tutor_id: string;
  course_number: string;
  course_title: string | null;
  department: string | null;
  instructor: string | null;
}

export interface BadgeRow {
  id: string;
  tutor_id: string;
  badge_type: string;
  earned_date: string;
  is_active: boolean;
}

/** A Stripe Connect account, reduced to what a tutor is allowed to see. */
export interface PayoutAccountRow {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements_due: string[];
}
