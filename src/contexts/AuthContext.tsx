
import { createContext, useContext, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { AuthContextType } from "./types/auth-types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, profile, loading, isStudent, isTutor, isProfileComplete, updateProfile } = useAuthState();
  const { signIn, signOut } = useAuthMethods();

  const value = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
