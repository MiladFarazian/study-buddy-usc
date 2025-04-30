
import { createContext, useContext, useState, useEffect } from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/integrations/supabase/types-extension";
import { ensureNotificationPreferences } from "@/lib/notification-utils";

// Define default profile for type safety
export const DEFAULT_PROFILE = {
  id: "",
  first_name: "",
  last_name: "",
  email: "",
  avatar_url: "",
  bio: "",
  major: "",
  graduation_year: "",
  hourly_rate: 0,
  role: "student",
  availability: null,
  average_rating: 0,
  approved_tutor: false,
  created_at: "",
  updated_at: "",
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loadingInitial: boolean;
  loadingProfile: boolean;
  isTutor: boolean;
  isStudent: boolean;
  isProfileComplete: boolean;
  signOut: () => Promise<{ success: boolean; error?: any | null }>;
  signIn: (provider: string, options?: any) => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loadingInitial: true,
  loadingProfile: false,
  loading: true,
  isTutor: false,
  isStudent: false,
  isProfileComplete: false,
  signOut: async () => ({ success: true }),
  signIn: async () => ({}),
  updateProfile: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setUserProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  const isTutor = profile?.role === 'tutor';
  const isStudent = profile?.role === 'student' || !profile?.role;
  
  // Calculate profile completeness
  const isProfileComplete = !!profile && 
    !!profile.first_name && 
    !!profile.last_name && 
    !!profile.major;

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }

    getInitialSession();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info("Auth state changed:", event);
        console.info("Current session:", session ? "Available" : "None");

        setLoadingInitial(true);

        if (event === "SIGNED_IN") {
          if (session?.user) {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (profileError) {
              console.error("Error fetching user profile:", profileError);
              setUserProfile(null);
            } else {
              setUserProfile(profileData);
              
              // Ensure the user has notification preferences
              await ensureNotificationPreferences(session.user.id);
            }
          }
        }

        if (event === "SIGNED_OUT") {
          setUserProfile(null);
        }

        setUser(session?.user ?? null);
        setLoadingInitial(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (provider: string, options?: any) => {
    try {
      const response = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options,
      });
      return response;
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: any }> => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return { success: false, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    setLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    loadingInitial,
    loadingProfile,
    loading: loadingInitial, // Add loading alias for backward compatibility
    isTutor,
    isStudent,
    isProfileComplete,
    signOut,
    signIn,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
