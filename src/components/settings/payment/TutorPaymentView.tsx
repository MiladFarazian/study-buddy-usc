import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, ArrowRight, BadgeCheck, Clock, ReceiptText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getStripeEnvironment } from "@/lib/stripe-utils";

interface TutorPaymentViewProps {
  user: any;
  profile: any;
}

export const TutorPaymentView: React.FC<TutorPaymentViewProps> = ({ user, profile }) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connectAccount, setConnectAccount] = useState<{
    has_account: boolean;
    account_id?: string;
    details_submitted?: boolean;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    needs_onboarding?: boolean;
    environment?: string;
  } | null>(null);
  const [loadingConnect, setLoadingConnect] = useState(true);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [processingTransfers, setProcessingTransfers] = useState(false);
  const [stripeEnvironment, setStripeEnvironment] = useState<string>('test');

  // Check Stripe environment on component mount
  useEffect(() => {
    const env = getStripeEnvironment();
    console.log(`Current Stripe environment: ${env}`);
    setStripeEnvironment(env);
  }, []);

  // Check Stripe Connect account status
  useEffect(() => {
    const checkConnectAccount = async () => {
      if (!user) {
        setLoadingConnect(false);
        return;
      }

      try {
        console.log(`Checking Stripe Connect account status for ${stripeEnvironment} mode...`);
        
        // Use the profile data directly
        if (profile) {
          const connectIdField = stripeEnvironment === 'production' ? 'stripe_connect_live_id' : 'stripe_connect_id';
          const onboardingCompleteField = stripeEnvironment === 'production' ? 'stripe_connect_live_onboarding_complete' : 'stripe_connect_onboarding_complete';
          
          const hasAccount = !!profile[connectIdField];
          const needsOnboarding = hasAccount && !profile[onboardingCompleteField];
          
          console.log(`Connect account from profile (${stripeEnvironment} mode):`, {
            has_account: hasAccount,
            account_id: profile[connectIdField],
            needs_onboarding: needsOnboarding
          });
          
          setConnectAccount({
            has_account: hasAccount,
            account_id: profile[connectIdField],
            needs_onboarding: needsOnboarding,
            details_submitted: profile[onboardingCompleteField],
            payouts_enabled: profile[onboardingCompleteField],
            environment: stripeEnvironment
          });
        } else {
          console.log("No profile data available");
          setConnectAccount({
            has_account: false,
            environment: stripeEnvironment
          });
        }
        
        // Fetch pending transfers if account is set up
        const connectIdField = stripeEnvironment === 'production' ? 'stripe_connect_live_id' : 'stripe_connect_id';
        const onboardingCompleteField = stripeEnvironment === 'production' ? 'stripe_connect_live_onboarding_complete' : 'stripe_connect_onboarding_complete';
        
        if (profile?.[connectIdField] && profile?.[onboardingCompleteField]) {
          fetchPendingTransfers();
        }
      } catch (error) {
        console.error(`Error checking Connect account (${stripeEnvironment} mode):`, error);
      } finally {
        setLoadingConnect(false);
      }
    };

    checkConnectAccount();
  }, [user, profile, stripeEnvironment]);

  const fetchPendingTransfers = async () => {
    if (!user) return;
    
    try {
      setLoadingTransfers(true);
      
      // Get pending transfers from Supabase
      const { data, error } = await supabase
        .from('pending_transfers')
        .select('*, sessions(*)')
        .eq('tutor_id', user.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      setPendingTransfers(data || []);
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const createConnectAccount = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`Initiating Stripe Connect account creation in ${stripeEnvironment} mode...`);
      
      // Use Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        method: 'POST',
        body: {}  // Empty body is fine, the function will use the auth token
      });
      
      if (error) {
        console.error(`Failed to create Connect account (${stripeEnvironment} mode):`, error);
        throw new Error(`Failed to create Connect account: ${error.message}`);
      }
      
      console.log(`Connect account creation response (${stripeEnvironment} mode):`, data);
      
      if (data?.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned from Edge Function');
      }
    } catch (error) {
      console.error(`Error creating Connect account (${stripeEnvironment} mode):`, error);
      toast({
        title: "Account Setup Error",
        description: `Failed to set up your payment account in ${stripeEnvironment} mode. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processTransfers = async () => {
    if (!user || !connectAccount?.has_account || connectAccount.needs_onboarding) return;
    
    setProcessingTransfers(true);
    try {
      console.log(`Processing pending transfers in ${stripeEnvironment} mode...`);
      
      // Use Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('transfer-pending-funds', {
        method: 'POST',
        body: { tutorId: user.id }
      });
      
      if (error) {
        console.error(`Failed to process transfers (${stripeEnvironment} mode):`, error);
        throw new Error(`Failed to process transfers: ${error.message}`);
      }
      
      console.log(`Transfer processing result (${stripeEnvironment} mode):`, data);
      
      if (data?.transfersProcessed && data.transfersProcessed.length > 0) {
        toast({
          title: "Transfers Processed",
          description: `Successfully processed ${data.transfersProcessed.length} payments in ${stripeEnvironment} mode.`,
        });
        // Refresh pending transfers
        await fetchPendingTransfers();
      } else {
        toast({
          title: "No Transfers",
          description: `No pending transfers found to process in ${stripeEnvironment} mode.`,
        });
      }
    } catch (error) {
      console.error(`Error processing transfers (${stripeEnvironment} mode):`, error);
      toast({
        title: "Transfer Error",
        description: `Failed to process pending transfers in ${stripeEnvironment} mode. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setProcessingTransfers(false);
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Payment Account ({stripeEnvironment === 'production' ? 'Live' : 'Test'} Mode)</h3>
          <div className="text-sm text-muted-foreground">
            {stripeEnvironment === 'production' && (
              <span className="text-green-600 font-semibold">Production Mode</span>
            )}
            {!loadingConnect && getStripeAccountStatus() === "Active" && (
              <div className="flex items-center text-green-600">
                <BadgeCheck className="h-5 w-5 mr-1" />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Set up your payment account to receive payments from students
          {stripeEnvironment === 'production' ? ' (Live Mode)' : ' (Test Mode)'}
        </p>

        {/* Loading state */}
        {loadingConnect ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking account status...</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-1">
                  <p className="font-medium">Stripe Connect Status {stripeEnvironment === 'production' ? '(Live)' : '(Test)'}</p>
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
                        <>Set Up Account</>
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
                        <>
                          Complete Setup
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
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

              {/* Status alerts */}
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
                    Your payment account is set up and ready to receive payments in {stripeEnvironment === 'production' ? 'live' : 'test'} mode.
                  </AlertDescription>
                </Alert>
              )}
              
              {stripeEnvironment === 'production' && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    You are now in <strong>production mode</strong>. All payments and transfers are real and will be processed through your bank account.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Earnings Dashboard - Only show if account is set up */}
      {connectAccount && connectAccount.has_account && !connectAccount.needs_onboarding && (
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-medium">Earnings {stripeEnvironment === 'production' ? '(Live)' : '(Test)'}</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your earnings from tutoring sessions
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <ReceiptText className="h-8 w-8 mx-auto text-usc-cardinal mb-2" />
                  <h4 className="text-lg font-medium">Pending Transfers</h4>
                  <p className="text-3xl font-bold mt-2">
                    {loadingTransfers ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : (
                      pendingTransfers.length
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Pending Transfers Section */}
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Pending Transfers {stripeEnvironment === 'production' ? '(Live)' : '(Test)'}</h4>
              {pendingTransfers.length > 0 && (
                <Button 
                  size="sm" 
                  onClick={processTransfers}
                  disabled={processingTransfers || loadingTransfers}
                >
                  {processingTransfers ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Transfers'
                  )}
                </Button>
              )}
            </div>
            
            {loadingTransfers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-gray-50">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending transfers</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTransfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transfer.sessions?.start_time ? (
                            new Date(transfer.sessions.start_time).toLocaleDateString()
                          ) : (
                            'Unknown Session'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          ${transfer.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
