import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, CreditCard, CheckCircle, Clock, DollarSign } from "lucide-react";

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
  stripe_payment_intent_id: string;
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

  // Calculate fees including Stripe's 2.9% + 30¢
  const calculateFees = (amount: number) => {
    // Amount is already in dollars, so convert to cents for Stripe fee calculation
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
      // Load last 5 payment transactions with related data in a single optimized query
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
        toast.success(`Both parties confirmed! Payment transfer initiated.`);
      } else {
        toast.success(`Session confirmed as ${role}`);
      }
      
      loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming session:', error);
      toast.error(`Failed to confirm session as ${role}`);
    }
  };

  const syncPaymentStatus = async (paymentIntentId: string, sessionId?: string) => {
    try {
      toast.loading('Syncing payment status...');
      
      const { data, error } = await supabase.functions.invoke('sync-payment-status', {
        body: { paymentIntentId, sessionId }
      });

      if (error) {
        toast.error(`Failed to sync payment: ${error.message}`);
        return;
      }

      toast.success(`Payment status synced: ${data.paymentStatus}`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error syncing payment:', error);
      toast.error('Failed to sync payment status');
    }
  };

  useEffect(() => {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Flow Tester</h1>
        <Button onClick={loadData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">Payment Transactions</CardTitle>
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

      {/* Latest 5 Transactions with Complete Payment Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Latest 5 Payment Transactions - Complete Flow
          </CardTitle>
          <CardDescription>
            Complete payment process view for each transaction: payment details, confirmation status, transfer monitoring, and end-to-end progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentTransactions.map((payment) => {
            const session = sessions.find(s => s.id === payment.session_id);
            const transfer = pendingTransfers.find(t => t.session_id === payment.session_id);
            const fees = calculateFees(payment.amount);
            const status = session ? getSessionStatus(session) : { label: 'Unknown', color: 'bg-gray-500' };
            
            const steps = [
              { label: 'Payment Captured', completed: true, icon: '💳' },
              { label: 'Session Scheduled', completed: !!session, icon: '📅' },
              { label: 'Student Confirmed', completed: session?.student_confirmed || false, icon: '👨‍🎓' },
              { label: 'Tutor Confirmed', completed: session?.tutor_confirmed || false, icon: '👨‍🏫' },
              { label: 'Transfer Created', completed: !!transfer, icon: '💰' },
              { label: 'Complete', completed: session?.tutor_confirmed && session?.student_confirmed && !!transfer, icon: '✅' }
            ];
            
            return (
              <div key={payment.id} className="border-2 rounded-lg p-6 space-y-4 bg-card">
                {/* Transaction Header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Transaction {payment.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Session: {payment.session_id.slice(0, 8)}... | Stripe: {payment.stripe_payment_intent_id}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    ${payment.amount.toFixed(2)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Payment Details & Session Controls */}
                  <div className="space-y-4">
                    {/* Payment Breakdown */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Breakdown
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Original Amount:</span>
                          <span>${fees.originalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Stripe Fee (2.9% + 30¢):</span>
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
                      
                      {/* Payment Status Sync */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Payment Status:</span>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncPaymentStatus(payment.stripe_payment_intent_id, payment.session_id)}
                          className="w-full"
                        >
                          Sync Payment Status
                        </Button>
                      </div>
                    </div>

                    {/* Session Confirmation Controls */}
                    {session && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Session Confirmation
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={status.color}>{status.label}</Badge>
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
                    {/* Transfer Monitoring */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Transfer Status
                      </h4>
                      {transfer ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Transfer ID:</span>
                            <span className="text-xs font-mono">{transfer.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Amount to Tutor:</span>
                            <span className="font-semibold">${((transfer.amount - transfer.platform_fee) / 100).toFixed(2)}</span>
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
                        <p className="text-sm text-muted-foreground">No transfer created yet</p>
                      )}
                    </div>

                    {/* End-to-End Progress */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Progress Flow
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
            <p className="text-center text-muted-foreground py-8">No payment transactions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlowTester;