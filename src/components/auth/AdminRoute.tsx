import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { hasAdminRole, loading: authLoading } = useAuth();

  const loading = adminLoading || authLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  // Allow access if either admin context or regular auth has admin role
  if (!isAdmin && !hasAdminRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};