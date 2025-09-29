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
    if (loading) return;
    
    if (!profile) {
      navigate('/login');
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        // Default redirects based on role
        const defaultRedirect = profile.role === 'tutor' ? '/tutor-dashboard' : '/settings/profile';
        navigate(defaultRedirect);
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

  if (!profile || !allowedRoles.includes(profile.role)) {
    return fallbackComponent || null;
  }

  return <>{children}</>;
};