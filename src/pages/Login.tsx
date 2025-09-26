
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdminRedirect } from "@/hooks/useAdminRedirect";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Login = () => {
  const { signIn, user, loading, hasAdminRole } = useAuth();
  const { adminLogin } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the admin redirect hook
  useAdminRedirect();
  
  // Get the page user was trying to access
  const from = location.state?.from?.pathname || "/";

  // Store the current path for redirect after auth
  if (from && from !== '/login' && from !== '/auth/callback') {
    sessionStorage.setItem('redirectAfterAuth', from);
  }

  // Store the current origin to ensure we stay in the same environment
  useEffect(() => {
    // Detect if we're in preview and store that info
    const isPreview = window.location.hostname.includes('preview--');
    if (isPreview) {
      sessionStorage.setItem('isPreviewEnv', 'true');
    } else {
      sessionStorage.removeItem('isPreviewEnv');
    }
  }, []);

  if (user) {
    // Admin users are handled by useAdminRedirect hook
    // For non-admin users, redirect to the page they were trying to access, or home
    if (!hasAdminRole) {
      return <Navigate to={from} replace />;
    }
    // Let useAdminRedirect handle admin users
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn("google");
      // After signing in, the auth state change will trigger a redirect
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = adminLogin(adminEmail, adminPassword);
      if (success) {
        navigate('/admin');
      } else {
        toast({
          title: "Error",
          description: "Invalid admin credentials",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-usc-cardinal">Study</span>
            <span className="text-usc-gold">Buddy</span>
          </h1>
          <p className="text-gray-600">Your USC tutoring and study partner</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{showAdminLogin ? "Admin Login" : "Sign In"}</CardTitle>
            <CardDescription>
              {showAdminLogin 
                ? "Access the admin dashboard" 
                : "Access your account with your USC Google account to connect with tutors and manage your study sessions"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAdminLogin ? (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In as Admin"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAdminLogin(false)}
                  disabled={isSubmitting}
                >
                  Back to Student Login
                </Button>
              </form>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your USC Google account (@usc.edu email only)
                </p>
                <Button 
                  onClick={handleGoogleSignIn} 
                  className="w-full flex items-center justify-center gap-2 bg-usc-cardinal hover:bg-usc-cardinal-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center">
            {!showAdminLogin && (
              <>
                <p className="text-sm text-gray-500">
                  Don't have an account? Google sign-in will automatically create one for you.
                </p>
                <p className="text-xs text-gray-500">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
                <Button 
                  variant="link" 
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setShowAdminLogin(true)}
                >
                  Admin Login
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
