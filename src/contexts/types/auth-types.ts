
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (provider: string, options?: any) => Promise<any>;
  signOut: () => Promise<{ success: boolean; error?: any | null }>;
  loading: boolean;
  isStudent: boolean; // Based on current view mode
  isTutor: boolean; // Based on current view mode AND approval
  isProfileComplete: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error: any | null }>;
  canBeTeacher: boolean; // Whether user is approved to be a tutor
  viewMode: 'student' | 'tutor'; // Current view preference
  setViewMode: (mode: 'student' | 'tutor') => void; // Toggle between modes
};

export type { Profile };
