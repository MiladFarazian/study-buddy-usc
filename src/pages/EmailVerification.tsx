
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const EmailVerification = () => {
  const { loading } = useAuth();

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
          <h1 className="text-3xl font-bold mb-2">Study<span className="text-usc-gold">Buddy</span></h1>
          <p className="text-gray-600">Your USC tutoring and study partner</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-usc-cardinal" />
              </div>
            </div>
            <CardTitle className="text-center">Email Verification Required</CardTitle>
            <CardDescription className="text-center">
              Please check your email to verify your account
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              We've sent a verification link to your email address. Please click on the link to verify your account and complete the registration process.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-sm text-gray-600">
              Verified already?{" "}
              <Link to="/login" className="text-usc-cardinal hover:underline">
                Go back to sign in
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              If you haven't received the email, please check your spam folder.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;
