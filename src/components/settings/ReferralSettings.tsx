import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Award, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const ReferralSettings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({ 
        title: "Copied to clipboard!",
        description: "Share your code with friends to unlock features."
      });
    }
  };

  const referralCount = profile?.referral_count || 0;

  return (
    <div className="space-y-6">
      {/* Your Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Help fellow Trojans discover Study Buddy and unlock features by building your study community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Code</p>
                <p className="text-3xl font-bold font-mono tracking-wider">
                  {profile?.referral_code || "LOADING..."}
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCopyCode}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div>
              <p className="font-semibold text-lg">Study Community Members</p>
              <p className="text-sm text-muted-foreground">
                Students who joined through your code
              </p>
            </div>
            <Badge variant="secondary" className="text-2xl px-4 py-2 bg-yellow-100 text-yellow-900 border-yellow-200">
              {referralCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Unlock Features */}
      <Card>
        <CardHeader>
          <CardTitle>Unlock Features</CardTitle>
          <CardDescription>
            Unlock features by helping others join the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Analytics Page */}
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border transition-all",
            referralCount >= 1 
              ? "bg-green-50 border-green-200" 
              : "bg-muted"
          )}>
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
              referralCount >= 1
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            )}>
              {referralCount >= 1 ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <p className="font-semibold">Analytics Page</p>
              <p className="text-sm text-muted-foreground">
                Track your study progress and session statistics
              </p>
            </div>
            {referralCount >= 1 && (
              <Badge className="bg-green-500 hover:bg-green-600">
                Unlocked
              </Badge>
            )}
          </div>
          
          {/* Resources Page - REMOVED, now unlocked by default */}
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      {referralCount >= 5 && (
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-purple-900">
                  Community Builder Badge Earned! 🎉
                </p>
                <p className="text-sm text-purple-700">
                  You've helped 5 students discover Study Buddy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {referralCount >= 10 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-yellow-900">
                  Study Champion Badge Earned! 🏆
                </p>
                <p className="text-sm text-yellow-700">
                  You've helped 10 students succeed - amazing impact on our community!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};