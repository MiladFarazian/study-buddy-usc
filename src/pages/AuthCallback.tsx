
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
        console.log("Processing authentication callback...");
        
        // Check if we have session data in the URL
        const hashParams = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        
        if (!hashParams && !searchParams.has('code')) {
          console.log("No authentication data found in URL");
          setError("No authentication data found");
          setIsLoading(false);
          return;
        }

        // Let Supabase handle the callback automatically
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
          
          // Get redirect path
          const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
          
          // Clean up session storage
          sessionStorage.removeItem('redirectAfterAuth');
          sessionStorage.removeItem('authOriginUrl');
          
          console.log(`Redirecting to: ${redirectTo}`);
          navigate(redirectTo, { replace: true });
        } else {
          // No session yet, wait a bit for the auth state to update
          setTimeout(() => {
            const currentSession = supabase.auth.getSession();
            if (!currentSession) {
              setError("Authentication failed");
            }
          }, 1000);
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
