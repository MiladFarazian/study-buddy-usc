import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

/**
 * Hook to redirect admins away from student/tutor pages
 * Use this on any page that admins should NOT access
 */
export const useAdminRedirect = () => {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  return { isAdmin, loading };
};
