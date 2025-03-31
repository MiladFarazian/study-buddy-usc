
import { Session, User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  // Add missing properties
  loading: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isProfileComplete: boolean;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
  signIn: (provider: 'google') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
