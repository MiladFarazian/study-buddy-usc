
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash
        const hashParams = window.location.hash;
        
        if (!hashParams) {
          console.warn("No authentication data found in URL");
          setError("No authentication data found in URL");
          setIsLoading(false);
          return;
        }

        console.log("Processing authentication callback...");
        
        // The Supabase client will automatically handle the hash processing
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error.message);
          setError(error.message);
          toast({
            title: "Authentication error",
            description: error.message,
            variant: "destructive",
          });
        } else if (data?.session) {
          console.log("Successfully authenticated");
          toast({
            title: "Success",
            description: "You are now signed in",
          });
          
          // Get the original URL where authentication was initiated
          const originUrl = sessionStorage.getItem('authOriginUrl');
          console.log("Original authentication URL:", originUrl);
          
          // Get the redirectAfterAuth path and make sure it exists
          let redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
          sessionStorage.removeItem('redirectAfterAuth');
          
          // Make sure we have a valid URL to redirect to
          redirectTo = redirectTo.startsWith('/') ? redirectTo : '/';
          
          // If we have an origin URL, make sure we stay in the same environment
          // by extracting just the path and appending to current origin
          if (originUrl) {
            try {
              const currentOrigin = window.location.origin;
              console.log(`Redirecting to: ${redirectTo} in ${currentOrigin}`);
              navigate(redirectTo, { replace: true });
            } catch (err) {
              console.error("Error parsing origin URL:", err);
              navigate(redirectTo, { replace: true });
            }
          } else {
            // Fallback to just redirecting to the path
            console.log(`Redirecting to: ${redirectTo}`);
            navigate(redirectTo, { replace: true });
          }
        }
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        setError("An unexpected error occurred during authentication");
        toast({
          title: "Authentication error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      
      if (event === 'SIGNED_IN' && session) {
        const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
        sessionStorage.removeItem('redirectAfterAuth');
        navigate(redirectTo, { replace: true });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (!isLoading && error) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-usc-cardinal mb-4" />
      <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
      <p className="text-gray-600">Please wait while we verify your identity...</p>
    </div>
  );
};

export default AuthCallback;
