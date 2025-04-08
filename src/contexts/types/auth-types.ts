
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (provider: string, options?: any) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isProfileComplete: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error: any | null }>;
};

export type { Profile };
