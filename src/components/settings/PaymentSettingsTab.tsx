
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { TutorPaymentView } from "./payment/TutorPaymentView";
import { StudentPaymentView } from "./payment/StudentPaymentView";

export const PaymentSettingsTab = () => {
  const { toast } = useToast();
  const { user, profile, isTutor } = useAuth();
  const [searchParams] = useSearchParams();

  // Check for Stripe redirect success/error
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      toast({
        title: "Stripe Connect Setup",
        description: "Your payment account setup was completed successfully.",
      });
    } else if (stripeStatus === 'refresh') {
      toast({
        title: "Stripe Connect Setup",
        description: "Please complete your payment account setup to receive payments.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Manage your payment information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTutor ? (
            <TutorPaymentView user={user} profile={profile} />
          ) : (
            <StudentPaymentView />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
