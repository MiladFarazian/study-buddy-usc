import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";

interface TutorPaymentViewProps {
  user: User | null;
  profile: Profile | null;
}

export const TutorPaymentView: React.FC<TutorPaymentViewProps> = ({ user, profile }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Stripe Connect Account
            <Badge variant="outline">Payment Links</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Set up your Stripe Connect account to receive payments from tutoring sessions.
            Payments are processed through secure Stripe checkout and transferred to your account.
          </p>
          <Button variant="outline" disabled>
            Setup Connect Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Earnings Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your earnings and payout history will appear here once you complete your first session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};