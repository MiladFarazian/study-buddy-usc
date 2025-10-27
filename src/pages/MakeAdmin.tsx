import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Admin Setup Page
 * 
 * This page allows the first user to promote themselves to admin status.
 * For security, this only works when no admin users exist in the system.
 */
const MakeAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMakeAdmin = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to become an admin.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session found");
      }

      const response = await fetch(
        `https://fzcyzjruixuriqzryppz.supabase.co/functions/v1/make-me-admin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create admin user');
      }

      setSuccess(true);
      toast({
        title: "Success!",
        description: "You have been promoted to admin. Redirecting...",
      });

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        // Force a page reload to refresh auth context
        window.location.href = '/admin';
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Admin Setup</CardTitle>
            </div>
            <CardDescription>
              You must be signed in to set up an admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in with your Google account before setting up admin access.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full mt-4"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Admin Setup</CardTitle>
          </div>
          <CardDescription>
            Initial admin account setup for your USC tutoring marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> You have been promoted to admin. Redirecting to admin dashboard...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> This page allows you to become the first admin user.
                    For security reasons, it only works when <strong>no admin users exist yet</strong>.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Current User Information:</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">{user.id}</code></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">What happens next:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>You'll be added to the <code className="text-xs bg-muted px-1 py-0.5 rounded">user_roles</code> table with admin privileges</li>
                    <li>You'll gain access to the admin dashboard at <code className="text-xs bg-muted px-1 py-0.5 rounded">/admin</code></li>
                    <li>You'll be able to manage users, view reports, and approve tutors</li>
                    <li>Additional admins must be added manually via SQL or by you as admin</li>
                  </ul>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleMakeAdmin}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up admin access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Make Me Admin
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MakeAdmin;