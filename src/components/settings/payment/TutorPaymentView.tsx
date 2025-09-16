import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types/profile";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { TutorEarningsSummary } from "@/components/payments/TutorEarningsSummary";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface TutorPaymentViewProps {
  user: User | null;
  profile: Profile | null;
}

const getAccountStatusInfo = (accountStatus: any) => {
  if (!accountStatus?.has_account) {
    return {
      label: "Not Set Up",
      variant: "destructive" as const,
      icon: AlertCircle,
      description: "No Stripe Connect account found"
    };
  }

  if (accountStatus.needs_onboarding) {
    return {
      label: "Setup Required",
      variant: "secondary" as const,
      icon: Clock,
      description: "Complete your account setup with Stripe"
    };
  }

  if (accountStatus.payouts_enabled) {
    return {
      label: "Active",
      variant: "default" as const,
      icon: CheckCircle,
      description: "Ready to receive payments"
    };
  }

  return {
    label: "Under Review",
    variant: "secondary" as const,
    icon: Clock,
    description: "Account submitted, awaiting approval"
  };
};

export const TutorPaymentView: React.FC<TutorPaymentViewProps> = ({ user, profile }) => {
  const { accountStatus, isChecking, loading, setupConnectAccount } = useStripeConnect();
  
  const statusInfo = accountStatus ? getAccountStatusInfo(accountStatus) : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Stripe Connect Account
            <Badge variant="outline">Payment Links</Badge>
            {accountStatus?.environment && (
              <Badge variant={accountStatus.environment === 'production' ? 'default' : 'outline'}>
                {accountStatus.environment === 'production' ? 'Live' : 'Test'} Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Set up your Stripe Connect account to receive payments from tutoring sessions.
            Payments are processed through secure Stripe checkout and transferred to your account.
          </p>
          
          {isChecking ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking account status...</span>
            </div>
          ) : statusInfo && (
            <div className="flex items-center gap-2 mb-4">
              <StatusIcon className="h-4 w-4" />
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <span className="text-sm text-muted-foreground">{statusInfo.description}</span>
            </div>
          )}

          {!accountStatus?.has_account || accountStatus?.needs_onboarding ? (
            <Button 
              onClick={setupConnectAccount}
              disabled={loading || isChecking}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                !accountStatus?.has_account ? 'Setup Connect Account' : 'Complete Account Setup'
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Account ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">
                    {accountStatus.account_id?.substring(0, 20)}...
                  </p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p className="text-muted-foreground">
                    {accountStatus.payouts_enabled ? 'Payouts Enabled' : 'Setup Required'}
                  </p>
                </div>
              </div>
              
              {accountStatus.needs_onboarding && (
                <Button 
                  onClick={setupConnectAccount}
                  disabled={loading}
                  variant="outline"
                  className="w-full mb-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <TutorEarningsSummary user={user} accountStatus={accountStatus} />
    </div>
  );
};