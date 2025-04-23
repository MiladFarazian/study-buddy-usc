
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthMethods = () => {
  const { toast } = useToast();

  const signIn = async (provider: 'google') => {
    try {
      const origin = window.location.origin;
      const redirectUrl = `${origin}/auth/callback`;
      
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
        return { error };
      } 
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  return { signIn, signOut };
};
