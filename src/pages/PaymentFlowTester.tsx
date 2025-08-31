import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, CreditCard, CheckCircle, Clock, DollarSign, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Session {
  id: string;
  student_id: string;
  tutor_id: string;
  start_time: string;
  end_time: string;
  status: string;
  tutor_confirmed: boolean;
  student_confirmed: boolean;
  completion_date: string | null;
  payment_status: string;
}

interface PaymentTransaction {
  id: string;
  session_id: string;
  amount: number;
  status: string;
  payment_link_id: string;
  payment_link_url: string;
  stripe_checkout_session_id: string | null;
  payment_completed_at: string | null;
  created_at: string;
  student_id: string;
  tutor_id: string;
}

interface PendingTransfer {
  id: string;
  session_id: string;
  tutor_id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
}

const PaymentFlowTester = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Calculate fees including Stripe's 2.9% + 30¢
  const calculateFees = (amount: number) => {
    const amountInCents = Math.round(amount * 100);
    const stripeFee = Math.round(amountInCents * 0.029 + 30); // 2.9% + 30¢
    const platformFee = Math.round(amountInCents * 0.15); // 15% of total
    const tutorAmountInCents = amountInCents - stripeFee - platformFee;
    
    return {
      originalAmount: amount,
      stripeFee,
      platformFee, 
      tutorAmount: tutorAmountInCents,
      totalFees: stripeFee + platformFee
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load last 5 payment transactions with related data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          sessions!inner(
            id,
            student_id,
            tutor_id,
            start_time,
            end_time,
            status,
            tutor_confirmed,
            student_confirmed,
            completion_date,
            payment_status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        toast.error('Failed to load payment data');
        return;
      }

      // Get session IDs for transfer lookup
      const sessionIds = paymentsData?.map(p => p.session_id).filter(Boolean) || [];
      
      // Load pending transfers for these sessions
      const { data: transfersData } = await supabase
        .from('pending_transfers')
        .select('*')
        .in('session_id', sessionIds);

      // Transform data to match existing structure
      const sessions = paymentsData?.map(p => p.sessions).filter(Boolean) || [];
      
      setSessions(sessions);
      setPaymentTransactions(paymentsData || []);
      setPendingTransfers(transfersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const confirmSession = async (sessionId: string, role: 'student' | 'tutor') => {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-session-complete', {
        body: { sessionId, userRole: role }
      });

      if (error) {
        toast.error(`Failed to confirm as ${role}: ${error.message}`);
        return;
      }

      if (data?.bothConfirmed) {
        toast.success(`Both parties confirmed! Transfer created for tutor payout.`);
      } else {
        toast.success(`Session confirmed as ${role}`);
      }
      
      loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming session:', error);
      toast.error(`Failed to confirm session as ${role}`);
    }
  };

  const createTestPaymentLink = async () => {
    try {
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        toast.error('Authentication required: Please log in to create payment links');
        console.error('Authentication error:', authError);
        return;
      }

      console.log('Creating test payment link for user:', session.user.id);

      // Create a test session first using current user as student
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          student_id: session.user.id, // Use current user as student
          tutor_id: '22222222-2222-2222-2222-222222222222', // Test tutor ID
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
          status: 'scheduled',
          payment_status: 'unpaid',
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        toast.error(`Failed to create test session: ${sessionError.message}`);
        return;
      }

      console.log('Test session created:', sessionData.id);

      // Create Payment Link with proper authentication
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: {
          sessionId: sessionData.id,
          amount: 50, // $50 test amount
          tutorId: sessionData.tutor_id,
          description: 'Test Tutoring Session'
        }
      });

      if (error) {
        console.error('Payment link creation error:', error);
        toast.error(`Failed to create payment link: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data || !data.payment_link_url) {
        console.error('No payment link URL returned:', data);
        toast.error('Payment link was not created properly');
        return;
      }

      console.log('Payment link created successfully:', data);

      // Open Payment Link in new tab
      window.open(data.payment_link_url, '_blank');
      toast.success('Payment Link created! Opening in new tab...');
      
      loadData(); // Reload data to show new transaction
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast.error(`Failed to create payment link: ${error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user || null);
    };
    
    checkAuth();
    loadData();
  }, []);

  const getSessionStatus = (session: Session) => {
    if (session.tutor_confirmed && session.student_confirmed) {
      return { label: 'Both Confirmed', color: 'bg-green-500' };
    }
    if (session.tutor_confirmed) {
      return { label: 'Tutor Confirmed', color: 'bg-yellow-500' };
    }
    if (session.student_confirmed) {
      return { label: 'Student Confirmed', color: 'bg-blue-500' };
    }
    return { label: 'Pending Confirmation', color: 'bg-gray-500' };
  };

  const getPaymentStatus = (payment: PaymentTransaction) => {
    if (payment.status === 'completed' && payment.payment_completed_at) {
      return { label: 'Payment Completed', color: 'bg-green-500' };
    }
    if (payment.status === 'pending') {
      return { label: 'Awaiting Payment', color: 'bg-orange-500' };
    }
    return { label: payment.status, color: 'bg-gray-500' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Links Flow Tester</h1>
        <div className="flex gap-2">
          <Button 
            onClick={createTestPaymentLink} 
            variant="outline"
            disabled={!isAuthenticated}
          >
            Create Test Payment Link
          </Button>
          <Button onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to create payment links. Please log in first.
            Current user: {currentUser ? currentUser.email : 'Not logged in'}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment & Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Links</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentTransactions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransfers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Links Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Links Flow - Complete Process
          </CardTitle>
          <CardDescription>
            Student clicks Pay → Redirected to Stripe → Pays → Returns to app → Platform holds funds → Both confirm → Tutor gets paid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentTransactions.map((payment) => {
            const session = sessions.find(s => s.id === payment.session_id);
            const transfer = pendingTransfers.find(t => t.session_id === payment.session_id);
            const fees = calculateFees(payment.amount);
            const sessionStatus = session ? getSessionStatus(session) : { label: 'Unknown', color: 'bg-gray-500' };
            const paymentStatus = getPaymentStatus(payment);
            
            const steps = [
              { label: 'Payment Link Created', completed: true, icon: '🔗' },
              { label: 'Student Paid via Stripe', completed: payment.status === 'completed', icon: '💳' },
              { label: 'Platform Holds Funds', completed: payment.status === 'completed', icon: '🏦' },
              { label: 'Student Confirmed', completed: session?.student_confirmed || false, icon: '👨‍🎓' },
              { label: 'Tutor Confirmed', completed: session?.tutor_confirmed || false, icon: '👨‍🏫' },
              { label: 'Tutor Payout Ready', completed: !!transfer, icon: '💰' },
            ];
            
            return (
              <div key={payment.id} className="border-2 rounded-lg p-6 space-y-4 bg-card">
                {/* Transaction Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Payment Link {payment.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(payment.created_at).toLocaleString()}
                    </p>
                    {payment.payment_completed_at && (
                      <p className="text-sm text-green-600">
                        Paid: {new Date(payment.payment_completed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      ${payment.amount.toFixed(2)}
                    </Badge>
                    <div className="mt-2">
                      <Badge className={paymentStatus.color}>
                        {paymentStatus.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Payment Details & Links */}
                  <div className="space-y-4">
                    {/* Payment Link Details */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Payment Link
                      </h4>
                      
                      {payment.payment_link_url && (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log('Opening payment link:', payment.payment_link_url);
                              if (payment.payment_link_url) {
                                window.open(payment.payment_link_url, '_blank');
                              } else {
                                toast.error('Payment link URL is missing');
                              }
                            }}
                            className="w-full"
                          >
                            Open Payment Link
                          </Button>
                          {payment.stripe_checkout_session_id && (
                            <p className="text-xs text-muted-foreground">
                              Checkout Session: {payment.stripe_checkout_session_id}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fee Breakdown */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Breakdown
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Student Paid:</span>
                          <span>${fees.originalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Stripe Fee:</span>
                          <span>-${(fees.stripeFee / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Platform Fee (15%):</span>
                          <span>-${(fees.platformFee / 100).toFixed(2)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold text-green-600">
                          <span>Tutor Gets:</span>
                          <span>${(fees.tutorAmount / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Session Confirmation Controls */}
                    {session && payment.status === 'completed' && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Session Confirmation
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={sessionStatus.color}>{sessionStatus.label}</Badge>
                          {session.completion_date && (
                            <Badge variant="outline" className="text-green-600">
                              Completed: {new Date(session.completion_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={session.student_confirmed ? "default" : "outline"}
                            onClick={() => confirmSession(session.id, 'student')}
                            disabled={session.student_confirmed}
                          >
                            {session.student_confirmed ? '✓ Student Confirmed' : 'Student Confirm'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={session.tutor_confirmed ? "default" : "outline"}
                            onClick={() => confirmSession(session.id, 'tutor')}
                            disabled={session.tutor_confirmed}
                          >
                            {session.tutor_confirmed ? '✓ Tutor Confirmed' : 'Tutor Confirm'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Transfer Status & Flow Progress */}
                  <div className="space-y-4">
                    {/* Transfer Status */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Tutor Payout Status
                      </h4>
                      {transfer ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Transfer ID:</span>
                            <span className="text-xs font-mono">{transfer.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Net to Tutor:</span>
                            <span className="font-semibold text-green-600">
                              ${((transfer.amount - transfer.platform_fee) / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Status:</span>
                            <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                              {transfer.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(transfer.created_at).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {payment.status === 'completed' 
                              ? 'Awaiting both parties to confirm session completion' 
                              : 'Payment must be completed first'}
                          </p>
                          {payment.status === 'pending' && (
                            <p className="text-xs text-orange-600">
                              Student needs to complete payment first
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress Flow */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Payment Flow Progress
                      </h4>
                      <div className="space-y-2">
                        {steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs ${step.completed ? 'text-green-700' : 'text-gray-500'}`}>
                              {step.icon} {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {paymentTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No payment transactions found</p>
              <Button onClick={createTestPaymentLink} variant="outline">
                Create Your First Payment Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlowTester;