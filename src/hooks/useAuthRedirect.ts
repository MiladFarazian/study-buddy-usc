
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@supabase/supabase-js";
import type { Profile } from "@/integrations/supabase/types-extension";

interface AuthRedirectResult {
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  updateProfile?: (updatedProfile: Partial<Profile>) => void;
}

export const useAuthRedirect = (
  redirectPath: string,
  requireAuth: boolean = true
): AuthRedirectResult => {
  const { user, loading, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [redirectChecked, setRedirectChecked] = useState(false);

  useEffect(() => {
    if (!loading && !redirectChecked) {
      // If auth is required and user is not authenticated, redirect to login
      if (requireAuth && !user) {
        navigate("/login", { replace: true });
      }
      // If auth is not required but user is authenticated, redirect to provided path
      else if (!requireAuth && user) {
        navigate(redirectPath, { replace: true });
      }
      setRedirectChecked(true);
    }
  }, [user, loading, navigate, redirectPath, requireAuth, redirectChecked]);

  return { user, loading, profile, updateProfile };
};
