import { createContext, useContext, useState, useEffect } from "react";
import {
  Session,
  User,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/integrations/supabase/types-extension";
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PROFILE } from "@/lib/constants";
import { ensureNotificationPreferences } from "@/lib/notification-utils";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loadingInitial: boolean;
  loadingProfile: boolean;
  isTutor: boolean;
  isStudent: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Profile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loadingInitial: true,
  loadingProfile: false,
  isTutor: false,
  isStudent: false,
  signOut: async () => {},
  updateProfile: async (updates: Profile) => {},
});

interface AuthContextProviderProps {
  children: React.ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setUserProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const navigate = useNavigate();

  const isTutor = profile?.role === 'tutor';
  const isStudent = profile?.role === 'student' || !profile?.role;

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    navigate('/login');
  };

  const updateProfile = async (updates: Profile) => {
    setLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setUserProfile(updates);
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
    isTutor,
    isStudent,
    signOut,
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
