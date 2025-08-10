
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RequireProfileCompletionProps {
  children: React.ReactNode;
}

const RequireProfileCompletion = ({ children }: RequireProfileCompletionProps) => {
  const { user, profile, loading, isProfileComplete } = useAuth();
  const location = useLocation();

  // If still loading, show a loading indicator to prevent incorrect redirects
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-usc-cardinal mb-4" />
        <p className="text-lg">Loading your profile...</p>
      </div>
    );
  }
  
  // Don't redirect if:
  // 1. User is not logged in (PrivateRoute will handle this)
  // 2. User is on the profile page already
  // 3. User is on the schedule page
  // 4. User is on the verify-email page
  // 5. User is on the auth callback page
  if (
    !user || 
    location.pathname === "/profile" || 
    location.pathname === "/schedule" ||
    location.pathname === "/verify-email" || 
    location.pathname.includes("/auth/callback")
  ) {
    return <>{children}</>;
  }

  // If profile is incomplete, redirect to the profile page
  if (!isProfileComplete) {
    console.log("Profile incomplete, redirecting to profile page", profile);
    return <Navigate to="/profile" state={{ requireCompletion: true }} replace />;
  }

  return <>{children}</>;
};

export default RequireProfileCompletion;
