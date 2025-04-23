
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthMethods = () => {
  const { toast } = useToast();

  const signIn = async (provider: 'google') => {
    try {
      // Detect if we're in the preview environment
      const isPreview = window.location.hostname.includes('preview--');
      
      // Use the preview URL if we're in preview, otherwise use the current origin
      const baseUrl = isPreview 
        ? 'https://preview--study-buddy-usc.lovable.app'
        : window.location.origin;
        
      const redirectUrl = `${baseUrl}/auth/callback`;
      
      console.log(`Using redirect URL: ${redirectUrl}`);
      
      // Store the current URL to redirect back to after auth
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      
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
