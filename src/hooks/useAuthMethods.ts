import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { resolveSsoMethod, signInWithEmailDomain } from "@/lib/auth/sso";

/**
 * Where identity providers send the user back to.
 *
 * Every entry point must agree on this string: it is sent as `redirect_uri` in
 * the authorization request, and providers reject a token exchange whose
 * redirect_uri differs from the one the code was issued for. It must also be
 * listed in the Supabase dashboard's redirect allowlist.
 */
export const AUTH_CALLBACK_PATH = '/auth/callback';

export const authCallbackUrl = () =>
  `${window.location.origin}${AUTH_CALLBACK_PATH}`;

/** Remembers where to return after login, ignoring the auth pages themselves. */
const rememberReturnPath = () => {
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath === '/login' ||
    currentPath === AUTH_CALLBACK_PATH ||
    currentPath === '/auth-callback';

  if (!isAuthPage) {
    sessionStorage.setItem('redirectAfterAuth', currentPath);
  }
};

export const useAuthMethods = () => {
  const { toast } = useToast();

  const signIn = async (provider: 'google') => {
    try {
      console.log("Initiating sign in with provider:", provider);

      rememberReturnPath();
      const redirectUrl = authCallbackUrl();

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

  const devSignUp = async (email: string, password: string) => {
    try {
      console.log("Dev signup with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Dev signup error:", error.message);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // If signup successful, create/update profile
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              role: 'student',
              first_name: 'Test',
              last_name: 'Student',
              major: 'Computer Science',
              graduation_year: '2025',
            });

          if (profileError) {
            console.warn("Profile creation warning:", profileError.message);
          }
        } catch (profileError) {
          console.warn("Profile creation error:", profileError);
        }
      }

      toast({
        title: "Account Created",
        description: "Test student account created successfully",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Dev signup error:', error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const devSignIn = async (email: string, password: string) => {
    try {
      console.log("Dev signin with email:", email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Dev signin error:", error.message);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Signed In",
        description: "Successfully signed in to test account",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Dev signin error:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  /**
   * Signs in by email domain: SAML for federated domains, Google otherwise.
   *
   * SAML returns a URL for us to navigate to; Google navigates itself. See
   * src/lib/auth/sso.ts for the home-realm discovery rules.
   */
  const signInWithSso = async (email: string) => {
    try {
      rememberReturnPath();

      const result = await signInWithEmailDomain(email, authCallbackUrl());

      if (!result.success) {
        toast({
          title: "Sign In Failed",
          description: result.error ?? "Could not start sign-in",
          variant: "destructive",
        });
        return { error: new Error(result.error ?? "Sign-in failed") };
      }

      // SAML hands back the IdP URL rather than redirecting for us.
      if (result.url) {
        window.location.assign(result.url);
      }

      return { success: true, method: result.method };
    } catch (error: any) {
      console.error('SSO sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  /** Which provider an email would use — lets the UI label the button. */
  const detectSsoMethod = (email: string) => resolveSsoMethod(email).method;

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

  return { signIn, signInWithSso, detectSsoMethod, signOut, devSignUp, devSignIn };
};