
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This handles the OAuth callback
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Once the auth state changes (which happens after the hash is processed)
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      }
    });

    // Process the hash if present
    const hashParams = window.location.hash;
    if (hashParams) {
      // The supabase client will automatically handle the hash with detectSessionInUrl
      console.log("Processing auth callback...");
    }

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      <span className="mt-4">Completing authentication...</span>
    </div>
  );
};

export default AuthCallback;
