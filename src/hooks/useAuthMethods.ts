
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthMethods = () => {
  const { toast } = useToast();

  // Helper function to check if we're in an iframe
  const isInIframe = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  };

  const signIn = async (provider: 'google') => {
    try {
      // Get the full current URL (including hostname) to determine environment
      const currentUrl = window.location.href;
      
      // Store the current URL in session storage to maintain the same environment after auth
      sessionStorage.setItem('authOriginUrl', currentUrl);
      
      // Use the current origin as the base URL for the redirect
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log(`Authentication initiated with redirect URL: ${redirectUrl}`);
      console.log(`Storing origin URL: ${currentUrl}`);
      
      // Store the current URL to redirect back to after auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);

      // Check if we're in an iframe
      const inIframe = isInIframe();
      
      if (inIframe) {
        console.log("Authentication initiated from within an iframe, opening auth in new window");
        
        // For iframe environments, we need to open authentication in a new tab/window
        // Store a flag so the new window knows it was opened from an iframe
        sessionStorage.setItem('authFromIframe', 'true');
        
        // Open the OAuth flow in a new window/tab
        const authWindow = window.open(
          `${window.location.origin}/login?iframe_auth=true`, 
          '_blank',
          'width=600,height=600'
        );
        
        // Set up message listener for when auth completes in the other window
        window.addEventListener('message', (event) => {
          // Only accept messages from our own origin
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'AUTH_SUCCESS') {
            console.log("Received auth success message from auth window");
            // The other window will handle the redirect back
            // We just need to refresh the state in this window
            if (authWindow) {
              authWindow.close();
            }
            
            // Force a refresh to get the latest auth state
            window.location.reload();
          }
        }, false);
        
        return { success: true, isIframe: true };
      }
      
      // For direct browser access, use the standard OAuth flow
      const isIframeAuth = new URLSearchParams(window.location.search).get('iframe_auth') === 'true';
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Restrict to USC email domains for Google login
            hd: 'usc.edu',
          },
        },
      });

      if (error) {
        console.error("Auth error:", error.message);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Store current URL before signing out, to ensure we stay in the same environment
      const currentUrl = window.location.href;
      sessionStorage.setItem('authOriginUrl', currentUrl);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error };
      } 
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return { signIn, signOut };
};
