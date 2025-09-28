import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminRedirect = () => {
  const { hasAdminRole, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after auth is loaded and user is authenticated
    if (!loading && user && hasAdminRole) {
      console.log('🔐 Admin user detected, redirecting to admin dashboard');
      navigate('/admin', { replace: true });
    }
  }, [hasAdminRole, loading, user, navigate]);

  return { hasAdminRole, loading };
};