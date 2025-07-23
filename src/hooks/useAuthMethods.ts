
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAuthMethods = () => {
  const { toast } = useToast();

  const signIn = async (provider: 'google') => {
    try {
      console.log("Initiating sign in with provider:", provider);
      
      // Store the current path for redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/auth/callback') {
        sessionStorage.setItem('redirectAfterAuth', currentPath);
      }
      
      // Use the current origin for the redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log(`Authentication initiated with redirect URL: ${redirectUrl}`);
      
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
      console.log("Signing out user");
      
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
      
      // Clean up any stored auth-related data
      sessionStorage.removeItem('redirectAfterAuth');
      sessionStorage.removeItem('authOriginUrl');
      
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
