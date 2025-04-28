
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthMethods = () => {
  const { toast } = useToast();

  const signIn = async (provider: 'google') => {
    try {
      // Check if we're in an iframe (preview window)
      const isInIframe = window !== window.parent;
      
      // Get the full current URL (including hostname) to determine environment
      const currentUrl = window.location.href;
      
      // Store the current URL in session storage to maintain the same environment after auth
      sessionStorage.setItem('authOriginUrl', currentUrl);
      
      // Use the current origin as the base URL for the redirect
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log(`Authentication initiated with redirect URL: ${redirectUrl}`);
      console.log(`Storing origin URL: ${currentUrl}`);
      console.log(`Is in iframe: ${isInIframe}`);
      
      // Store the current URL to redirect back to after auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      
      // If we're in an iframe, open the auth in a new tab/window
      // This prevents the white screen issue in the preview
      if (isInIframe) {
        const authUrl = await supabase.auth.getAuthSignInURL({
          provider,
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              // Restrict to USC email domains for Google login
              hd: 'usc.edu',
            },
          },
        });
        
        if (authUrl.error) throw authUrl.error;
        
        // Open auth in a new window/tab
        window.open(authUrl.data.url, '_blank');
        
        toast({
          title: "Authentication Window Opened",
          description: "Please complete sign in in the new window. This preview will update once you're logged in.",
        });
        
        return { success: true };
      }
      
      // Standard flow for non-iframe context
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
