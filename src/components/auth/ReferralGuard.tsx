import { ReactNode } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralGuardProps {
  children: ReactNode;
  minReferrals: number;
  featureName: string;
}

export const ReferralGuard = ({ 
  children, 
  minReferrals, 
  featureName 
}: ReferralGuardProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const referralCount = profile?.referral_count || 0;

  if (referralCount < minReferrals) {
    return (
      <div className="container py-12 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {featureName} Locked
            </CardTitle>
            <CardDescription className="text-base">
              Help {minReferrals} fellow Trojan{minReferrals === 1 ? '' : 's'} join to unlock this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Your Progress
              </p>
              <p className="text-4xl font-bold mb-2">
                {referralCount} / {minReferrals}
              </p>
              <p className="text-sm text-muted-foreground">
                Help {minReferrals - referralCount} more {minReferrals - referralCount === 1 ? 'student' : 'students'} join
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="font-semibold text-center">How to unlock:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  Share Study Buddy with USC friends
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  They enter your code when signing up
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  Feature unlocks automatically!
                </li>
              </ol>
            </div>
            
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to="/settings/referrals">
                  <Users className="mr-2 h-4 w-4" />
                  View My Code
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
