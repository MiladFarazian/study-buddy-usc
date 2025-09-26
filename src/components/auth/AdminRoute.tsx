import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { hasAdminRole, loading: authLoading, user } = useAuth();

  // Only show loading if BOTH contexts are loading (not OR)
  const loading = adminLoading && authLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  // Allow access if: admin context OR regular auth has admin role OR noah's email
  const isNoahEmail = user?.email === 'noah@studybuddyusc.com';
  if (!isAdmin && !hasAdminRole && !isNoahEmail) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};