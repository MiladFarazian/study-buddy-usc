import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authenticated but not admin, redirect to home
    if (!loading && !isAdmin) {
      navigate('/admin-login', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};