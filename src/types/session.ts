
import { SessionType } from "@/lib/scheduling/types/booking";

export interface Session {
  id: string;
  course_id: string | null;
  tutor_id: string;
  student_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  session_type?: SessionType;
  zoom_meeting_id?: string | null;
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
  zoom_password?: string | null;
  tutor?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  course?: {
    id: string;
    course_number: string;
    course_title: string | null;
  };
}
