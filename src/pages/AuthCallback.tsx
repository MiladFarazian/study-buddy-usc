
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isAllowedEmail } from "@/lib/auth/sso";

/**
 * OAuth 2.0 / SAML redirect handler.
 *
 * Under PKCE the provider returns an authorization `code`, not a session. This
 * page redeems it via `exchangeCodeForSession`, which sends the code together
 * with the verifier supabase-js stored when the flow began. Without that
 * exchange the user comes back to a blank page and no session — the failure
 * mode the implicit flow hid, because the token was already in the fragment.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // React 18 StrictMode runs effects twice in development. An authorization
  // code is single-use, so the second run would redeem an already-spent code
  // and report a spurious failure.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const finishAuth = async () => {
      const params = new URLSearchParams(window.location.search);

      // The provider reports failure in the query string per RFC 6749 §4.1.2.1
      // (access_denied when the user declines the consent screen).
      const providerError = params.get("error");
      if (providerError) {
        const description = params.get("error_description") ??
          "The identity provider rejected the sign-in request.";
        console.error("Auth callback error:", providerError, description);
        setError(
          providerError === "access_denied"
            ? "Sign-in was cancelled."
            : description,
        );
        setIsLoading(false);
        return;
      }

      const code = params.get("code");

      try {
        let session = null;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code,
          );
          if (error) throw error;
          session = data.session;
        } else {
          // No code in the URL: either detectSessionInUrl already consumed a
          // legacy fragment response, or the user opened this route directly.
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data.session;
        }

        if (!session) {
          setError("No session was created. Please try signing in again.");
          setIsLoading(false);
          return;
        }

        // Domain membership is enforced here, not just requested via `hd`:
        // that parameter is a hint the user can strip from the URL.
        if (!isAllowedEmail(session.user.email)) {
          console.warn("Rejecting non-USC account:", session.user.email);
          await supabase.auth.signOut();
          setError(
            "StudyBuddy is open to USC accounts only. Please sign in with your @usc.edu email.",
          );
          setIsLoading(false);
          return;
        }

        // Strip the code and state from the address bar so a page refresh
        // doesn't replay a spent authorization code.
        window.history.replaceState({}, "", window.location.pathname);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("student_onboarding_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileData && !profileData.student_onboarding_complete) {
          navigate("/onboarding/student", { replace: true });
          return;
        }

        toast({ title: "Success", description: "You are now signed in" });

        const redirectTo = sessionStorage.getItem("redirectAfterAuth") || "/";
        sessionStorage.removeItem("redirectAfterAuth");
        sessionStorage.removeItem("authOriginUrl");

        // Only same-origin relative paths: an attacker who can set that key
        // should not be able to turn our callback into an open redirect.
        const safeRedirect = redirectTo.startsWith("/") &&
            !redirectTo.startsWith("//")
          ? redirectTo
          : "/";

        navigate(safeRedirect, { replace: true });
      } catch (cause) {
        const message = cause instanceof Error
          ? cause.message
          : "An unexpected error occurred during authentication";
        console.error("Unexpected error during auth callback:", cause);
        setError(message);
        toast({
          title: "Authentication error",
          description: message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    finishAuth();
  }, [navigate, toast]);

  if (!isLoading && error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4"
        role="alert"
      >
        <AlertCircle className="h-12 w-12 text-usc-cardinal mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">Sign-in failed</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
        <Navigate to="/login" replace state={{ authError: error }} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-slate-50"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-12 w-12 animate-spin text-usc-cardinal mb-4"
        aria-hidden="true"
      />
      <h1 className="text-xl font-semibold mb-2">Completing sign-in</h1>
      <p className="text-gray-600">Please wait while we verify your identity…</p>
    </div>
  );
};

export default AuthCallback;
