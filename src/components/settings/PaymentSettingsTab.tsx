
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { TutorPaymentView } from "./payment/TutorPaymentView";
import { StudentPaymentView } from "./payment/StudentPaymentView";
import { Badge } from "@/components/ui/badge";
import { getStripeEnvironment } from "@/lib/stripe-utils";

export const PaymentSettingsTab = () => {
  const { toast } = useToast();
  const { user, profile, isTutor } = useAuth();
  const [searchParams] = useSearchParams();
  const [stripeEnvironment, setStripeEnvironment] = useState<string>('test');

  // Check Stripe environment on component mount
  useEffect(() => {
    const env = getStripeEnvironment();
    console.log(`Current Stripe environment: ${env}`);
    setStripeEnvironment(env);
  }, []);

  // Check for Stripe redirect success/error
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    
    console.log(`Stripe redirect status: ${stripeStatus}, Environment: ${stripeEnvironment}`);
    
    if (stripeStatus === 'success') {
      toast({
        title: `Stripe Connect Setup (${stripeEnvironment === 'production' ? 'Live' : 'Test'} Mode)`,
        description: "Your payment account setup was completed successfully.",
      });
    } else if (stripeStatus === 'refresh') {
      toast({
        title: `Stripe Connect Setup (${stripeEnvironment === 'production' ? 'Live' : 'Test'} Mode)`,
        description: "Please complete your payment account setup to receive payments.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast, stripeEnvironment]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Settings</CardTitle>
            {stripeEnvironment === 'production' && (
              <Badge className="bg-green-600">Live Mode</Badge>
            )}
            {stripeEnvironment === 'test' && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">Test Mode</Badge>
            )}
          </div>
          <CardDescription>
            Manage your payment information and account settings
            {stripeEnvironment === 'production' 
              ? ' - You are in production mode with real transactions' 
              : ' - This is test mode, no real money is involved'}
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
