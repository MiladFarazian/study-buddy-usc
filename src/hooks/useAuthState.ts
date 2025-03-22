
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/contexts/types/auth-types";
import { useAuthProfile } from "./useAuthProfile";

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, updateProfile } = useAuthProfile(user?.id);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Only finished loading once we've checked for session AND loaded profile
      if (!session?.user) {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Set loading to false when profile is loaded (after user is set)
  useEffect(() => {
    if (user === null || profile !== null) {
      setLoading(false);
    }
  }, [user, profile]);

  // Calculate profile completeness and role flags
  const isProfileComplete = !!profile && !!profile.first_name && !!profile.last_name && !!profile.major;
  const isStudent = profile?.role === 'student';
  const isTutor = profile?.role === 'tutor';

  return {
    session,
    user,
    profile,
    loading,
    isStudent,
    isTutor,
    isProfileComplete,
    updateProfile
  };
};
