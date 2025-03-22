
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Email sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return { signIn, signInWithEmail, signUp, signOut };
};
