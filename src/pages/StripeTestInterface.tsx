import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  stripe_connect_id: string;
  stripe_connect_onboarding_complete: boolean;
  hourly_rate: number;
}

interface PaymentTransaction {
  id: string;
  session_id: string;
  student_id: string;
  tutor_id: string;
  amount: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string;
  payment_intent_status: string;
}

interface PendingTransfer {
  id: string;
  tutor_id: string;
  student_id: string;
  amount: number;
  status: string;
  created_at: string;
  transfer_id: string;
}

interface StripeDiagnostics {
  server_account_id: string;
  server_secret_mode: 'test' | 'live';
  server_publishable_key_masked: string;
  expected_publishable_key_last4: string;
  frontend_publishable_key_masked?: string;
  keysMatch?: boolean;
  frontendLast4?: string;
}

export default function StripeTestInterface() {
  const { user, profile } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Test form states
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [bookingAmount, setBookingAmount] = useState<string>('50');
  const [stripeEnvironment, setStripeEnvironment] = useState<string>('loading...');
  const [secretsStatus, setSecretsStatus] = useState<any>({});
  
  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<StripeDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
    checkStripeEnvironment();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadTutors(),
      loadPaymentTransactions(),
      loadPendingTransfers()
    ]);
  };

  const loadTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, stripe_connect_id, stripe_connect_onboarding_complete, hourly_rate')
        .eq('role', 'tutor')
        .eq('approved_tutor', true);
      
      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error loading tutors:', error);
      toast.error('Failed to load tutors');
    }
  };

  const loadPaymentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setPaymentTransactions(data || []);
    } catch (error) {
      console.error('Error loading payment transactions:', error);
    }
  };

  const loadPendingTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setPendingTransfers(data || []);
    } catch (error) {
      console.error('Error loading pending transfers:', error);
    }
  };

  const checkStripeEnvironment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-config');
      if (error) throw error;
      
      console.log('Stripe config response:', data);
      setStripeEnvironment(data?.environment || 'unknown');
      
      // Use the new debug format from the function
      if (data?.debug?.secretsStatus) {
        setSecretsStatus(data.debug.secretsStatus);
      } else {
        // Fallback for old format
        setSecretsStatus({
          STRIPE_SECRET_KEY: 'unknown',
          STRIPE_PUBLISHABLE_KEY: 'unknown',
          STRIPE_CONNECT_SECRET_KEY: 'unknown',
          STRIPE_WEBHOOK_SECRET: 'unknown'
        });
      }
    } catch (error) {
      console.error('Error checking Stripe environment:', error);
      setStripeEnvironment('error');
      setSecretsStatus({
        STRIPE_SECRET_KEY: 'error',
        STRIPE_PUBLISHABLE_KEY: 'error',
        STRIPE_CONNECT_SECRET_KEY: 'error',
        STRIPE_WEBHOOK_SECRET: 'error'
      });
    }
  };

  const createConnectAccount = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account');
      
      if (error) throw error;
      
      if (data?.accountLinkUrl) {
        // Open in new tab for testing
        window.open(data.accountLinkUrl, '_blank');
        toast.success('Stripe Connect onboarding opened in new tab');
      } else {
        toast.error('No account link received');
      }
    } catch (error) {
      console.error('Error creating Connect account:', error);
      toast.error('Failed to create Connect account');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectAccountStatus = async (tutorId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-account', {
        body: { tutorId }
      });
      
      if (error) throw error;
      
      toast.success(`Account status: ${data?.status || 'Unknown'}`);
      await loadTutors(); // Refresh tutor data
    } catch (error) {
      console.error('Error checking Connect account:', error);
      toast.error('Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const createTestBooking = async () => {
    if (!user || !selectedTutorId || !bookingAmount) {
      toast.error('Please fill in all fields and log in');
      return;
    }

    const selectedTutor = tutors.find(t => t.id === selectedTutorId);
    if (!selectedTutor) {
      toast.error('Selected tutor not found');
      return;
    }

    setLoading(true);
    try {
      // Create a test session first
      const sessionData = {
        student_id: user.id,
        tutor_id: selectedTutorId,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        status: 'scheduled' as const,
        course_id: 'TEST-101',
        notes: 'Test booking for payment flow testing',
        session_type: 'online' as const
      };

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create payment intent
      const paymentData = {
        sessionId: session.id,
        amount: Math.round(parseFloat(bookingAmount) * 100), // Convert to cents
        tutorId: selectedTutorId,
        studentId: user.id,
        tutorName: `${selectedTutor.first_name} ${selectedTutor.last_name}`,
        studentEmail: user.email
      };

      const { data: paymentIntent, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
        body: paymentData
      });

      if (paymentError) throw paymentError;

      if (paymentIntent?.clientSecret) {
        toast.success('Payment intent created! Check the payment transactions below.');
        await loadPaymentTransactions();
      } else {
        toast.error('No client secret received');
      }
    } catch (error) {
      console.error('Error creating test booking:', error);
      toast.error('Failed to create test booking');
    } finally {
      setLoading(false);
    }
  };

  const processTransfers = async (tutorId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('transfer-pending-funds', {
        body: { tutorId }
      });
      
      if (error) throw error;
      
      toast.success('Transfer processing initiated');
      await loadPendingTransfers();
    } catch (error) {
      console.error('Error processing transfers:', error);
      toast.error('Failed to process transfers');
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    
    try {
      // Get frontend publishable key
      const frontendResponse = await supabase.functions.invoke('get-stripe-config');
      const frontendKey = frontendResponse.data?.publishableKey;
      
      // Get server diagnostics
      const diagnosticsResponse = await supabase.functions.invoke('stripe-diagnostics');
      
      if (diagnosticsResponse.error) {
        throw new Error(diagnosticsResponse.error.message || 'Diagnostics failed');
      }
      
      const diagnosticsData = diagnosticsResponse.data;
      
      // Check if keys match
      const frontendLast4 = frontendKey?.slice(-4);
      const serverLast4 = diagnosticsData.expected_publishable_key_last4;
      const keysMatch = frontendLast4 === serverLast4;
      
      setDiagnostics({
        ...diagnosticsData,
        keysMatch,
        frontendLast4,
      } as StripeDiagnostics);
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      setDiagnosticsError(error.message || 'Failed to run diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Stripe Payment System Test Interface</h1>
        <p className="text-muted-foreground mt-2">Test your complete tutoring marketplace payment flow</p>
      </div>

      {/* Stripe Environment Check - Dev Only */}
      {process.env.NODE_ENV !== 'production' && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Stripe Environment Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runDiagnostics} 
                disabled={diagnosticsLoading}
                size="sm"
              >
                {diagnosticsLoading ? 'Checking...' : 'Run Diagnostics'}
              </Button>
            </div>
            
            {diagnosticsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">{diagnosticsError}</p>
              </div>
            )}
            
            {diagnostics && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Keys Match:</span>
                  {diagnostics.keysMatch ? (
                    <Badge className="bg-green-100 text-green-800">✅ Yes</Badge>
                  ) : (
                    <Badge variant="destructive">❌ No</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Server Account:</strong> {diagnostics.server_account_id}</p>
                    <p><strong>Server Mode:</strong> {diagnostics.server_secret_mode}</p>
                    <p><strong>Server PK:</strong> {diagnostics.server_publishable_key_masked}</p>
                  </div>
                  <div>
                    <p><strong>Frontend PK Last4:</strong> ...{diagnostics.frontendLast4}</p>
                    <p><strong>Server PK Last4:</strong> ...{diagnostics.expected_publishable_key_last4}</p>
                  </div>
                </div>
                
                {!diagnostics.keysMatch && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Frontend and server are using different Stripe accounts/sandboxes. 
                      Payments will fail. Use the same Stripe account keys for both.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Environment</Label>
              <Badge variant={stripeEnvironment === 'production' ? 'destructive' : 'secondary'}>
                {stripeEnvironment}
              </Badge>
            </div>
            {Object.entries(secretsStatus).map(([key, status]) => (
              <div key={key}>
                <Label className="text-xs">{key.replace('STRIPE_', '').replace('_', ' ')}</Label>
                <Badge variant={status === 'configured' ? 'default' : 'destructive'}>
                  {status === 'configured' ? 'Available' : status === 'missing' ? 'Missing' : 'Error'}
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Show raw debug data */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs">
            <Label>Debug Data:</Label>
            <pre className="mt-2 overflow-x-auto">{JSON.stringify(secretsStatus, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tutor Onboarding Flow */}
        <Card>
          <CardHeader>
            <CardTitle>👨‍🏫 Tutor Onboarding Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createConnectAccount} 
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Stripe Connect Account'}
            </Button>
            
            <Separator />
            
            <div>
              <Label>Current Tutors</Label>
              <div className="space-y-2 mt-2">
                {tutors.map(tutor => (
                  <div key={tutor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{tutor.first_name} {tutor.last_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Rate: ${tutor.hourly_rate || 'Not set'}/hr
                      </div>
                      {tutor.stripe_connect_id && (
                        <div className="text-xs text-muted-foreground">
                          Connect ID: {tutor.stripe_connect_id.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={tutor.stripe_connect_onboarding_complete ? 'default' : 'secondary'}>
                        {tutor.stripe_connect_onboarding_complete ? 'Complete' : 'Pending'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => checkConnectAccountStatus(tutor.id)}
                        disabled={loading}
                      >
                        Check Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Payment Flow */}
        <Card>
          <CardHeader>
            <CardTitle>👨‍🎓 Student Payment Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tutor-select">Select Tutor</Label>
              <Select value={selectedTutorId} onValueChange={setSelectedTutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.filter(t => t.stripe_connect_onboarding_complete).map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.first_name} {tutor.last_name} (${tutor.hourly_rate || 50}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Session Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(e.target.value)}
                placeholder="50"
              />
            </div>

            <Button 
              onClick={createTestBooking}
              disabled={loading || !user || !selectedTutorId}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Book and Pay Test Session'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>💳 Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Payment Intent</th>
                  <th className="text-left p-2">Session ID</th>
                </tr>
              </thead>
              <tbody>
                {paymentTransactions.map(transaction => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-2">{new Date(transaction.created_at).toLocaleString()}</td>
                    <td className="p-2">${transaction.amount}</td>
                    <td className="p-2">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs">{transaction.stripe_payment_intent_id || 'N/A'}</td>
                    <td className="p-2 text-xs">{transaction.session_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Pending Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Transfer ID</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map(transfer => (
                  <tr key={transfer.id} className="border-b">
                    <td className="p-2">{new Date(transfer.created_at).toLocaleString()}</td>
                    <td className="p-2">${transfer.amount}</td>
                    <td className="p-2">
                      <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                        {transfer.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs">{transfer.transfer_id || 'Pending'}</td>
                    <td className="p-2">
                      {transfer.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => processTransfers(transfer.tutor_id)}
                          disabled={loading}
                        >
                          Process
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <Button variant="outline" onClick={loadInitialData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh All Data'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Test the complete flow: Tutor onboarding → Student payment → Transfer processing
        </p>
      </div>
    </div>
  );
}