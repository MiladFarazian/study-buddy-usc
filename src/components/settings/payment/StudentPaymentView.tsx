
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Clock } from "lucide-react";
import { getStripeEnvironment } from "@/lib/stripe-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const StudentPaymentView = () => {
  const [stripeEnvironment, setStripeEnvironment] = useState<string>('test');

  // Check Stripe environment on component mount
  useEffect(() => {
    const env = getStripeEnvironment();
    console.log(`Current Stripe environment for student view: ${env}`);
    setStripeEnvironment(env);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        
        {stripeEnvironment === 'production' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              You are in live mode. Any payments you make will be real charges to your payment method.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground">
          Your payment information is securely stored with our payment processor.
          Payment methods are collected during the session booking process.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center p-4">
              <CreditCard className="h-12 w-12 text-usc-cardinal mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment Methods</h3>
              <p className="text-sm text-muted-foreground">
                Payment methods are added when you book a session
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center p-4">
              <Clock className="h-12 w-12 text-usc-cardinal mb-4" />
              <h3 className="text-lg font-medium mb-2">Payment History</h3>
              <p className="text-sm text-muted-foreground">
                View your payment history in the Sessions section
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
