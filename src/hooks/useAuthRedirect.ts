
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
  const { user, profile, loading, signOut, isTutor = false, isStudent = false, isProfileComplete = false } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

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
