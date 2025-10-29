
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
  
  // Track user's view preference (student mode vs tutor mode)
  const [viewMode, setViewMode] = useState<'student' | 'tutor'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profileView');
      if (saved === 'student' || saved === 'tutor') return saved;
    }
    return 'student';
  });

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

  // Real-time profile updates subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time profile subscription for user:', user.id);
    
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
        },
        (payload) => {
          console.log('🔄 Profile updated in real-time:', payload.new);
          // Re-fetch the profile to get the latest data
          if (payload.new) {
            updateProfile(payload.new as Partial<Profile>);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up profile subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, updateProfile]);

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
    approvedTutor: profile?.approved_tutor || false
  });

  if (profile) {
    console.log('👤 Profile loaded:', {
      id: profile.id,
      approvedTutor: profile.approved_tutor,
      firstName: profile.first_name,
      lastName: profile.last_name
    });
  }

  // Sync viewMode with localStorage and profile approval status
  useEffect(() => {
    if (profile) {
      const canBeTeacher = profile.approved_tutor === true;
      const saved = localStorage.getItem('profileView') as 'student' | 'tutor' | null;
      
      // If user is viewing tutor mode but not approved, force student mode
      if (saved === 'tutor' && !canBeTeacher) {
        setViewMode('student');
        localStorage.setItem('profileView', 'student');
      } else if (saved && (saved === 'student' || (saved === 'tutor' && canBeTeacher))) {
        setViewMode(saved);
      } else if (!saved && canBeTeacher) {
        // Default to tutor mode if approved and no preference set
        setViewMode('tutor');
        localStorage.setItem('profileView', 'tutor');
      } else {
        // Default to student mode
        setViewMode('student');
        localStorage.setItem('profileView', 'student');
      }
    }
  }, [profile?.approved_tutor]);

  // Listen for localStorage changes (when user toggles in ProfileSettings)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileView' && (e.newValue === 'student' || e.newValue === 'tutor')) {
        setViewMode(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate profile completeness and role flags based on VIEW MODE
  const isProfileComplete = !!profile && !!profile.first_name && !!profile.last_name && !!profile.major && !!profile.graduation_year;
  const canBeTeacher = profile?.approved_tutor === true;
  const isTutor = canBeTeacher && viewMode === 'tutor';
  const isStudent = viewMode === 'student';

  return {
    session,
    user,
    profile,
    loading,
    isStudent,
    isTutor,
    isProfileComplete,
    updateProfile,
    canBeTeacher, // Whether user is approved to be a tutor
    viewMode, // Current view preference
    setViewMode: (mode: 'student' | 'tutor') => {
      if (mode === 'tutor' && !canBeTeacher) {
        console.warn('Cannot switch to tutor mode: user is not approved');
        return;
      }
      setViewMode(mode);
      localStorage.setItem('profileView', mode);
      // Trigger storage event for other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'profileView',
        newValue: mode,
        oldValue: viewMode
      }));
    }
  };
};
