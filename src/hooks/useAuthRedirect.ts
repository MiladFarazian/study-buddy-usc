
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthRedirect(redirectTo: string, requireAuth: boolean = true) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // If we require authentication and there's no user, redirect
      if (requireAuth && !user) {
        navigate("/login", { replace: true });
      }
      
      // If we require NO authentication and there IS a user, redirect
      if (!requireAuth && user) {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, loading, navigate, redirectTo, requireAuth]);

  return { user, loading };
}
