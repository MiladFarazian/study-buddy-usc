
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
    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log("Initializing auth state...");
      
      // First set up the listener to avoid race conditions
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log("Auth state changed:", event);
          
          if (isMounted) {
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
          
          // Check if we need to refresh the page in iframe mode
          // This helps solve the white screen issue after auth
          if (event === 'SIGNED_IN' && window !== window.parent) {
            console.log("Signed in while in iframe, refreshing...");
            // Small delay to ensure state is updated
            setTimeout(() => {
              window.location.href = window.location.origin + (sessionStorage.getItem('redirectAfterAuth') || '/');
            }, 500);
          }
        }
      );
      
      // Then check for existing session
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session:", currentSession ? "Found" : "None");
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (!currentSession?.user) {
            setLoading(false); // No user, so no profile to wait for
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        if (isMounted) {
          setLoading(false);
        }
      }

      return () => subscription.unsubscribe();
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
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
