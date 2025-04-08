
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";
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
      
      // Only finish loading once we've checked for session
      // Profile loading is handled separately to prevent race conditions
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
  // This ensures we wait for profile data before making decisions
  useEffect(() => {
    if (user === null || profile !== null) {
      // Wait a bit to ensure profile data is fully populated
      const timer = setTimeout(() => {
        setLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  // Log profile information for debugging
  useEffect(() => {
    if (profile) {
      console.log("Profile loaded in useAuthState:", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        major: profile.major,
        role: profile.role,
        isComplete: !!(profile.first_name && profile.last_name && profile.major)
      });
    }
  }, [profile]);

  // Calculate profile completeness and role flags
  // Make sure this matches the check in RequireProfileCompletion
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
