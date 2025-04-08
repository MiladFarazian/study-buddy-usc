
import { createContext, useContext, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { AuthContextType } from "./types/auth-types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, profile, loading, isStudent, isTutor, isProfileComplete, updateProfile } = useAuthState();
  const { signIn, signOut } = useAuthMethods();

  const value: AuthContextType = {
    session,
    user,
    profile,
    signIn,
    signOut,
    loading,
    isStudent,
    isTutor,
    isProfileComplete,
    updateProfile,
  };

  // Don't show loading screen on initial auth check to prevent page flashing
  // The individual protected routes will handle their own loading states
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
