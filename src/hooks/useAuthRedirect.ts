
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export interface AuthRedirectResult {
  user: any;
  profile: any;
  loading: boolean;
  isProfileComplete: boolean;
  isTutor: boolean;
  isStudent: boolean;
  signOut: () => Promise<{ success: boolean; error?: any | null }>;
}

export const useAuthRedirect = (redirectPath: string, requireAuth: boolean = false): AuthRedirectResult => {
  const { user, profile, loading, signOut, isTutor, isStudent } = useAuth();
  const navigate = useNavigate();
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Calculate profile completion status
    const calculateProfileCompletion = () => {
      setIsProfileComplete(!!(
        profile &&
        profile.first_name &&
        profile.last_name &&
        profile.major &&
        profile.graduation_year
      ));
    };

    calculateProfileCompletion();

    if (requireAuth && !user) {
      navigate("/login?redirect=" + redirectPath);
    }
  }, [user, profile, loading, navigate, redirectPath, requireAuth]);

  return { 
    user, 
    profile, 
    loading, 
    isProfileComplete, 
    isTutor, 
    isStudent, 
    signOut 
  };
};
