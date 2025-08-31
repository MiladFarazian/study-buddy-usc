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
    const stripeFee = Math.round(amount * 0.029 + 30); // 2.9% + 30¢
    const platformFee = Math.round(amount * 0.15); // 15% of total
    const tutorAmount = amount - stripeFee - platformFee;
    
    return {
      originalAmount: amount,
      stripeFee,
      platformFee,
      tutorAmount,
      totalFees: stripeFee + platformFee
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load payment transactions
      const { data: paymentsData } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load pending transfers
      const { data: transfersData } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      setSessions(sessionsData || []);
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
      const { error } = await supabase.functions.invoke('confirm-session-complete', {
        body: { sessionId, userRole: role }
      });

      if (error) {
        toast.error(`Failed to confirm as ${role}: ${error.message}`);
        return;
      }

      toast.success(`Session confirmed as ${role}`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error confirming session:', error);
      toast.error(`Failed to confirm session as ${role}`);
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

      {/* Session Confirmation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Session Confirmation Simulator
          </CardTitle>
          <CardDescription>
            Test the session confirmation flow by simulating student and tutor confirmations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            const payment = paymentTransactions.find(p => p.session_id === session.id);
            const fees = payment ? calculateFees(payment.amount) : null;
            
            return (
              <div key={session.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Session {session.id.slice(0, 8)}...</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.start_time).toLocaleString()}
                    </p>
                    {payment && fees && (
                      <div className="text-xs space-y-1 mt-2">
                        <p>Amount: ${(fees.originalAmount / 100).toFixed(2)}</p>
                        <p>Stripe Fee: ${(fees.stripeFee / 100).toFixed(2)} (2.9% + 30¢)</p>
                        <p>Platform Fee: ${(fees.platformFee / 100).toFixed(2)} (15%)</p>
                        <p className="font-semibold">Tutor Gets: ${(fees.tutorAmount / 100).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
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
                
                {session.completion_date && (
                  <p className="text-xs text-green-600">
                    Completed: {new Date(session.completion_date).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Transfer Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Transfer Monitoring Dashboard
          </CardTitle>
          <CardDescription>
            Monitor automatic transfers to tutors after session completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTransfers.length === 0 ? (
            <p className="text-muted-foreground">No pending transfers found</p>
          ) : (
            <div className="space-y-3">
              {pendingTransfers.map((transfer) => (
                <div key={transfer.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Transfer {transfer.id.slice(0, 8)}...</h4>
                      <p className="text-sm text-muted-foreground">
                        Session: {transfer.session_id.slice(0, 8)}...
                      </p>
                      <p className="text-sm">
                        Amount: ${(transfer.amount / 100).toFixed(2)} - 
                        Platform Fee: ${(transfer.platform_fee / 100).toFixed(2)} = 
                        <span className="font-semibold"> ${((transfer.amount - transfer.platform_fee) / 100).toFixed(2)}</span>
                      </p>
                    </div>
                    <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                      {transfer.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* End-to-End Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            End-to-End Flow Progress
          </CardTitle>
          <CardDescription>
            Visual progress tracker for the complete payment and transfer flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => {
              const payment = paymentTransactions.find(p => p.session_id === session.id);
              const transfer = pendingTransfers.find(t => t.session_id === session.id);
              
              const steps = [
                { label: 'Payment Captured', completed: !!payment, icon: '💳' },
                { label: 'Session Scheduled', completed: true, icon: '📅' },
                { label: 'Student Confirmed', completed: session.student_confirmed, icon: '👨‍🎓' },
                { label: 'Tutor Confirmed', completed: session.tutor_confirmed, icon: '👨‍🏫' },
                { label: 'Transfer Processed', completed: !!transfer, icon: '💰' },
                { label: 'Complete', completed: session.tutor_confirmed && session.student_confirmed && !!transfer, icon: '✅' }
              ];
              
              return (
                <div key={session.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Session {session.id.slice(0, 8)}...</h4>
                  <div className="flex items-center space-x-2 overflow-x-auto">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                          step.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span>{step.icon}</span>
                          <span>{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-8 h-0.5 ${step.completed ? 'bg-green-300' : 'bg-gray-300'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFlowTester;