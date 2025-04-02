
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvailabilitySettings } from "@/components/scheduling/AvailabilitySettings";
import { useSearchParams } from "react-router-dom";

export const TutorSettingsTab = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connectAccount, setConnectAccount] = useState<{
    has_account: boolean;
    account_id?: string;
    details_submitted?: boolean;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    needs_onboarding?: boolean;
  } | null>(null);
  const [loadingConnect, setLoadingConnect] = useState(true);

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

  // Check Stripe Connect account status
  useEffect(() => {
    const checkConnectAccount = async () => {
      if (!user || !profile || profile.role !== 'tutor') {
        setLoadingConnect(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) throw sessionError;

        const response = await fetch('/api/check-connect-account', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check Connect account status');
        }

        const data = await response.json();
        setConnectAccount(data);
      } catch (error) {
        console.error('Error checking Connect account:', error);
      } finally {
        setLoadingConnect(false);
      }
    };

    checkConnectAccount();
  }, [user, profile]);

  const createConnectAccount = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw sessionError;

      const response = await fetch('/api/create-connect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create Connect account');
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error) {
      console.error('Error creating Connect account:', error);
      toast({
        title: "Account Setup Error",
        description: "Failed to set up your payment account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStripeAccountStatus = () => {
    if (!connectAccount) {
      return "Not set up";
    }

    if (!connectAccount.has_account) {
      return "Not set up";
    }

    if (connectAccount.needs_onboarding) {
      return "Incomplete setup";
    }

    if (connectAccount.details_submitted && connectAccount.payouts_enabled) {
      return "Active";
    }

    return "Pending verification";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tutor Settings</CardTitle>
          <CardDescription>
            Manage your tutor profile, availability, and payment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Account</h3>
            <p className="text-sm text-muted-foreground">
              Set up your payment account to receive payments from students.
            </p>

            {loadingConnect ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking account status...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">Stripe Connect Status</p>
                      <p className="text-sm text-muted-foreground">
                        {getStripeAccountStatus()}
                      </p>
                    </div>
                    <div>
                      {!connectAccount || !connectAccount.has_account ? (
                        <Button 
                          onClick={createConnectAccount} 
                          disabled={loading}
                          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Setting up...
                            </>
                          ) : (
                            'Set Up Account'
                          )}
                        </Button>
                      ) : connectAccount.needs_onboarding ? (
                        <Button 
                          onClick={createConnectAccount} 
                          disabled={loading}
                          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Complete Setup'
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm">Ready</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {connectAccount && connectAccount.has_account && connectAccount.needs_onboarding && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        Your payment account setup is incomplete. Complete the setup to receive payments from students.
                      </AlertDescription>
                    </Alert>
                  )}

                  {connectAccount && connectAccount.has_account && !connectAccount.needs_onboarding && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your payment account is set up and ready to receive payments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tutor Availability</h3>
            <AvailabilitySettings />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
