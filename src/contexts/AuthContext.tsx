
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { AuthContextType } from "./types/auth-types";

// Demo mode helpers
const DEMO_KEY = "studybuddy_demo_tutor";
export const enableDemoMode = () => {
  localStorage.setItem(DEMO_KEY, "1");
};
export const disableDemoMode = () => {
  localStorage.removeItem(DEMO_KEY);
};
export const isDemoMode = () => typeof window !== "undefined" && localStorage.getItem(DEMO_KEY) === "1";

// Provide a demo profile and user object
const DEMO_USER = {
  id: "demo-tutor-1",
  aud: "authenticated",
  email: "tutor-demo@usc.edu",
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  created_at: new Date().toISOString(),
  app_metadata: { provider: "demo" },
  user_metadata: {},
  identities: [],
  last_sign_in_at: new Date().toISOString(),
  role: "authenticated",
};

const DEMO_PROFILE = {
  id: "demo-tutor-1",
  user_id: "demo-tutor-1",
  first_name: "Demo",
  last_name: "Tutor",
  bio: "I am a demo tutor. All actions are read-only.",
  major: "Computer Science",
  role: "tutor",
  avatar_url: "",
  is_active: true,
  // Add any more fields as needed in your Profile type...
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Check demo mode on mount and whenever localStorage changes
  const [demoMode, setDemoMode] = useState(isDemoMode());

  useEffect(() => {
    const onStorage = () => setDemoMode(isDemoMode());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Watch demoMode updates if user toggles it
  useEffect(() => {
    setDemoMode(isDemoMode());
    // Listen for secret button or exit
    const syncDemo = () => setDemoMode(isDemoMode());
    window.addEventListener("demoModeChanged", syncDemo);
    return () => window.removeEventListener("demoModeChanged", syncDemo);
  }, []);

  const { session, user, profile, loading, isStudent, isTutor, isProfileComplete, updateProfile } = useAuthState();
  const { signIn, signOut } = useAuthMethods();

  let demoContext: AuthContextType | null = null;
  if (demoMode) {
    demoContext = {
      session: { // Mock Session
        access_token: "demo-token",
        refresh_token: "demo-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: DEMO_USER,
        provider_token: null,
      },
      user: DEMO_USER as any,
      profile: DEMO_PROFILE,
      signIn: async () => {}, // No-op
      signOut: async () => {
        disableDemoMode();
        window.dispatchEvent(new Event("demoModeChanged"));
      },
      loading: false,
      isStudent: false,
      isTutor: true,
      isProfileComplete: true,
      updateProfile: async () => ({ success: false, error: "Demo mode: readonly" }),
    }
  }

  const value: AuthContextType = demoContext || {
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

  return <AuthContext.Provider value={value}>{children}{demoMode && <DemoModeBanner />}</AuthContext.Provider>;
}

// Simple banner to leave demo mode
function DemoModeBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-usc-cardinal text-white rounded-t-lg px-6 py-2 flex gap-4 items-center shadow-lg text-sm font-medium">
        You are browsing as a <span className="font-bold">Demo Tutor</span>
        <button
          className="ml-4 px-3 py-1 rounded bg-white text-usc-cardinal hover:bg-usc-gold hover:text-usc-cardinal font-semibold transition"
          onClick={() => {
            disableDemoMode();
            window.dispatchEvent(new Event("demoModeChanged"));
            window.location.reload(); // ensure app refresh/redirect
          }}
        >
          Exit Demo Mode
        </button>
      </div>
    </div>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

