
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
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🔐 Initializing auth state...');
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔐 Initial session check:', { 
          hasSession: !!session, 
          userId: session?.user?.id || 'none',
          error: error?.message 
        });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('🔐 Auth initialization error:', error);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', { 
          event, 
          userId: session?.user?.id || 'no user',
          hasSession: !!session 
        });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Simple loading state management - no user means auth is done loading
  useEffect(() => {
    if (!user && !session) {
      // No user and no session = we're done loading (user is not logged in)
      setLoading(false);
    } else if (user && profile !== undefined) {
      // We have user and profile data (or null) = we're done loading
      setLoading(false);
    }
    // Otherwise, keep loading = true
  }, [user, session, profile]);

  console.log('🔐 Auth state summary:', {
    session: !!session,
    user: !!user,
    userId: user?.id || 'none',
    profile: !!profile,
    loading,
    profileRole: profile?.role || 'none'
  });

  if (profile) {
    console.log('👤 Profile loaded:', {
      id: profile.id,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name
    });
  }

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
