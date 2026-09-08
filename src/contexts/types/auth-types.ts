
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn: (provider: string, options?: any) => Promise<any>;
  /** Routes an email to SAML or Google and starts the redirect. */
  signInWithSso: (email: string) => Promise<any>;
  /** Which provider an email resolves to, for labelling the sign-in button. */
  detectSsoMethod: (email: string) => "saml" | "google" | "unsupported";
  signOut: () => Promise<{ success: boolean; error?: any | null }>;
  loading: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isProfileComplete: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error: any | null }>;
};

export type { Profile };
