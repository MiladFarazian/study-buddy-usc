
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const isInIframe = window !== window.parent;
    
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash
        const hashParams = window.location.hash;
        
        if (!hashParams) {
          console.log("No authentication data found in URL");
          if (isMounted) {
            setError("No authentication data found in URL");
            setIsLoading(false);
          }
          return;
        }

        console.log("Processing authentication callback...");
        
        // The Supabase client will automatically handle the hash processing
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error.message);
          if (isMounted) {
            setError(error.message);
            toast({
              title: "Authentication error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (data?.session) {
          console.log("Successfully authenticated");
          
          if (isMounted) {
            toast({
              title: "Success",
              description: "You are now signed in",
            });
            
            // Get the original URL where authentication was initiated
            const originUrl = sessionStorage.getItem('authOriginUrl');
            console.log("Original authentication URL:", originUrl);
            
            // Get redirect path
            let redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
            console.log("Redirect path:", redirectTo);
            
            // Handle iframe parent communication if needed
            if (isInIframe) {
              try {
                // Try to notify parent frame if possible
                window.parent.postMessage({
                  type: 'AUTH_COMPLETE',
                  success: true
                }, '*');
                console.log("Sent auth success message to parent frame");
              } catch (err) {
                console.error("Error communicating with parent frame:", err);
              }
              
              // Special handling for iframe - open success message
              setProcessingComplete(true);
              return; // Don't navigate, let the parent handle it
            }
            
            // If we have an origin URL, use it to construct the full redirect URL
            // This ensures we stay in the same environment (preview vs production)
            if (originUrl) {
              try {
                const originUrlObj = new URL(originUrl);
                // We want to stay on the same hostname/origin but go to the redirect path
                const redirectURL = new URL(redirectTo, originUrlObj.origin);
                console.log(`Constructed redirect URL from origin: ${redirectURL.toString()}`);
                
                // Navigate using the full URL
                window.location.href = redirectURL.toString();
                return; // Exit early as we're doing a full page navigation
              } catch (e) {
                console.error("Error constructing redirect URL:", e);
                // Fall back to normal navigation if URL construction fails
              }
            }
            
            sessionStorage.removeItem('redirectAfterAuth');
            sessionStorage.removeItem('authOriginUrl'); // Clean up
            
            // Make sure we have a valid URL to redirect to
            redirectTo = redirectTo.startsWith('/') ? redirectTo : '/';
            
            console.log(`Redirecting to: ${redirectTo}`);
            navigate(redirectTo, { replace: true });
          }
        }
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        if (isMounted) {
          setError("An unexpected error occurred during authentication");
          toast({
            title: "Authentication error",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    handleAuthCallback();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event);
      
      if (event === 'SIGNED_IN' && session) {
        // Get the authOriginUrl to ensure we stay in the same environment
        const originUrl = sessionStorage.getItem('authOriginUrl');
        const redirectTo = sessionStorage.getItem('redirectAfterAuth') || '/';
        
        // Handle iframe parent communication
        if (isInIframe) {
          try {
            window.parent.postMessage({
              type: 'AUTH_COMPLETE',
              success: true
            }, '*');
          } catch (e) {
            console.error("Error posting message to parent:", e);
          }
          setProcessingComplete(true);
          return;
        }
        
        if (originUrl) {
          try {
            const originUrlObj = new URL(originUrl);
            const redirectURL = new URL(redirectTo, originUrlObj.origin);
            window.location.href = redirectURL.toString();
            return;
          } catch (e) {
            console.error("Error constructing redirect URL from auth listener:", e);
          }
        }
        
        sessionStorage.removeItem('redirectAfterAuth');
        sessionStorage.removeItem('authOriginUrl');
        navigate(redirectTo, { replace: true });
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [navigate, toast, location]);

  // Render iframe success message if needed
  if (processingComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-green-50 p-4 rounded-lg text-center max-w-md">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
          <p className="text-gray-600 mb-4">You've been successfully signed in.</p>
          <p className="text-sm text-gray-500">This window will close or refresh automatically.</p>
        </div>
      </div>
    );
  }

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
