import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'tutor')[];
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  redirectTo,
  fallbackComponent 
}: RoleGuardProps) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;
    
    // Don't redirect if profile is not loaded yet
    if (!profile) return;

    // Check if user meets role requirements
    const isTutor = profile.approved_tutor === true;
    const meetsRequirement = allowedRoles.some(role => 
      role === 'tutor' ? isTutor : !isTutor
    );

    // Only redirect if user doesn't meet requirements
    if (!meetsRequirement) {
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        // Default redirects based on approval status
        const defaultRedirect = isTutor ? '/tutor-dashboard' : '/settings/profile';
        navigate(defaultRedirect, { replace: true });
      }
    }
  }, [profile, loading, navigate, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!profile) {
    return fallbackComponent || null;
  }

  const isTutor = profile.approved_tutor === true;
  const meetsRequirement = allowedRoles.some(role => 
    role === 'tutor' ? isTutor : !isTutor
  );

  if (!meetsRequirement) {
    return fallbackComponent || null;
  }

  return <>{children}</>;
};