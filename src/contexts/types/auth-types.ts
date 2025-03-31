
import { Session, User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (provider: 'google') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isProfileComplete: boolean;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
};
