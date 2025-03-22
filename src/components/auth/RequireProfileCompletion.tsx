
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RequireProfileCompletionProps {
  children: React.ReactNode;
}

const RequireProfileCompletion = ({ children }: RequireProfileCompletionProps) => {
  const { user, isProfileComplete, loading } = useAuth();
  const location = useLocation();

  // Don't redirect if:
  // 1. Still loading
  // 2. User is not logged in (PrivateRoute will handle this)
  // 3. User is on the profile page already
  // 4. User is on the verify-email page
  // 5. User is completing their profile
  if (
    loading || 
    !user || 
    location.pathname === "/profile" || 
    location.pathname === "/verify-email" || 
    location.pathname.includes("/auth/callback")
  ) {
    return <>{children}</>;
  }

  // If profile is incomplete, redirect to the profile page
  if (!isProfileComplete) {
    return <Navigate to="/profile" state={{ requireCompletion: true }} replace />;
  }

  return <>{children}</>;
};

export default RequireProfileCompletion;
