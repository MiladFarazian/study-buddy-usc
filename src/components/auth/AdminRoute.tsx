import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Secure Admin Route Guard
 * 
 * Protects admin-only routes by verifying admin status through
 * server-side database queries. Users without admin role in the
 * user_roles table are redirected to the home page.
 * 
 * SECURITY: This component relies on server-side RLS policies
 * and the has_role() database function for authorization.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    // Redirect unauthorized users to home page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};