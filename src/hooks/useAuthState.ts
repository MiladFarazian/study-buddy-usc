
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
    let cleanup: (() => void) | undefined;
    
    const initializeAuth = async () => {
      console.log("Initializing auth state...");
      
      // Set up the auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log("Auth state changed:", event, newSession ? "with session" : "no session");
          
          // Update state
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Handle specific events
          if (event === 'SIGNED_OUT') {
            console.log("User signed out");
          } else if (event === 'SIGNED_IN' && newSession) {
            console.log("User signed in");
          }
          
          // Set loading to false only after we've processed the auth state
          setLoading(false);
        }
      );
      
      cleanup = () => subscription.unsubscribe();
      
      // Then check for existing session
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session:", currentSession ? "Found" : "None");
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
        
        // If no session found, we're done loading
        if (!currentSession) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Update loading state based on profile data - only if we have a user but no profile yet
  useEffect(() => {
    if (user && profile === null) {
      // Still loading profile data, keep loading true
      setLoading(true);
    } else if (user && profile) {
      // We have both user and profile, loading is done
      setLoading(false);
    }
    // If no user, loading state is handled by auth initialization
  }, [user, profile]);

  // Log profile information for debugging
  useEffect(() => {
    if (profile) {
      console.log("Profile loaded in useAuthState:", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        major: profile.major,
        role: profile.role,
        isComplete: !!(profile.first_name && profile.last_name && profile.major && profile.graduation_year)
      });
    }
  }, [profile]);

  // Calculate profile completeness and role flags
  const isProfileComplete = !!profile && !!profile.first_name && !!profile.last_name && !!profile.major && !!profile.graduation_year;
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
