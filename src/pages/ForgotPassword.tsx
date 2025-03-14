
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password reset email sent",
          description: "Please check your email for the password reset link",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Study<span className="text-usc-gold">Buddy</span></h1>
          <p className="text-gray-600">Your USC tutoring and study partner</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="p-2 bg-green-50 text-green-700 rounded-md">
                  Password reset email sent! Please check your inbox.
                </div>
                <p>
                  If you don't see the email, please check your spam folder.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="yourname@usc.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-usc-cardinal hover:underline">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
