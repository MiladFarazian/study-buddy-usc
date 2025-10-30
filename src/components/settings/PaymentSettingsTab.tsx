
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { TutorPaymentView } from "./payment/TutorPaymentView";
import { StudentPaymentView } from "./payment/StudentPaymentView";
import { Badge } from "@/components/ui/badge";
import { useViewMode } from "@/contexts/ViewModeContext";
import { supabase } from "@/integrations/supabase/client";

export const PaymentSettingsTab = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { isTutorView } = useViewMode();
  const [searchParams] = useSearchParams();
  const [stripeEnvironment, setStripeEnvironment] = useState<string>('test');

  // Fetch Stripe environment from edge function
  useEffect(() => {
    const fetchStripeEnvironment = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-stripe-config');
        
        if (data?.environment === 'live') {
          setStripeEnvironment('production');
        } else {
          setStripeEnvironment('test');
        }
      } catch (error) {
        console.error('Failed to fetch Stripe environment:', error);
        setStripeEnvironment('test');
      }
    };
    
    fetchStripeEnvironment();
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
          {isTutorView ? (
            <TutorPaymentView user={user} profile={profile} />
          ) : (
            <StudentPaymentView />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
