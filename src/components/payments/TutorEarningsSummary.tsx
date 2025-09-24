import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, DollarSign, Calendar, ExternalLink } from "lucide-react";

interface TutorEarningsSummaryProps {
  user: User | null;
  accountStatus: any;
}

interface EarningsData {
  recent_payments: Array<{
    amount: number;
    created_at: string;
    status: string;
    session_id: string | null;
  }>;
  recent_transfers: Array<{
    amount: number;
    created_at: string;
    status: string;
    session_id: string | null;
  }>;
  recent_refunds: Array<{
    refund_amount: number;
    cancelled_at: string;
    cancellation_reason: string | null;
    original_amount: number;
  }>;
  pending_amount: number;
  total_earned: number;
  this_month_earned: number;
  total_refunds: number;
  net_earnings: number;
}

export const TutorEarningsSummary: React.FC<TutorEarningsSummaryProps> = ({ user, accountStatus }) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchEarningsData();
    } else {
      setLoading(false);
    }
  }, [user, accountStatus]);

  const fetchEarningsData = async () => {
    if (!user) return;

    try {
      // Fetch payment transactions
      const { data: payments, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('amount, created_at, status, session_id')
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent transfers
      const { data: transfers, error: transferError } = await supabase
        .from('pending_transfers')
        .select('amount, created_at, status, session_id')
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch refunded sessions that affected this tutor
      const { data: refunds, error: refundError } = await supabase
        .from('sessions')
        .select(`
          refund_amount,
          cancelled_at,
          cancellation_reason,
          payment_transactions!inner(amount)
        `)
        .eq('tutor_id', user.id)
        .gt('refund_amount', 0)
        .order('cancelled_at', { ascending: false })
        .limit(10);

      if (paymentError || transferError || refundError) {
        console.error('Error fetching data:', paymentError || transferError || refundError);
        toast({
          title: "Error",
          description: "Failed to load earnings data",
          variant: "destructive",
        });
        return;
      }

      // Calculate totals from payments
      const completedPayments = payments?.filter(p => p.status === 'completed') || [];
      const completedTransfers = transfers?.filter(t => t.status === 'completed') || [];
      const pendingTransfers = transfers?.filter(t => t.status === 'pending') || [];
      
      const totalEarned = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = pendingTransfers.reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate refund totals
      const refundData = refunds?.map(r => ({
        refund_amount: r.refund_amount || 0,
        cancelled_at: r.cancelled_at || '',
        cancellation_reason: r.cancellation_reason,
        original_amount: r.payment_transactions?.[0]?.amount || 0
      })) || [];
      
      const totalRefunds = refundData.reduce((sum, r) => sum + r.refund_amount, 0);
      const netEarnings = totalEarned - totalRefunds;
      
      // Calculate this month's earnings
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthEarned = completedPayments
        .filter(p => new Date(p.created_at) >= thisMonth)
        .reduce((sum, p) => sum + p.amount, 0);

      setEarningsData({
        recent_payments: payments || [],
        recent_transfers: transfers || [],
        recent_refunds: refundData,
        pending_amount: pendingAmount,
        total_earned: totalEarned,
        this_month_earned: thisMonthEarned,
        total_refunds: totalRefunds,
        net_earnings: netEarnings
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccessDashboard = async () => {
    if (!user) return;

    setDashboardLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-tutor-dashboard-link', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating dashboard link:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to access dashboard",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open dashboard in new tab
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Dashboard link was not generated",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error accessing dashboard:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    // Convert cents to dollars for display
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Earnings Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading earnings data...</span>
          </div>
        ) : earningsData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{formatAmount(earningsData.this_month_earned)}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{formatAmount(earningsData.pending_amount)}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-green-800">{formatAmount(earningsData.net_earnings)}</div>
                <div className="text-xs text-green-600">Net Earnings</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-lg font-semibold text-red-800">-{formatAmount(earningsData.total_refunds)}</div>
                <div className="text-xs text-red-600">Total Refunds</div>
              </div>
            </div>

            {/* Recent Payments */}
            {earningsData.recent_payments.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Payments</h4>
                <div className="space-y-2">
                  {earningsData.recent_payments.slice(0, 5).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                        <span className="text-sm">{formatDate(payment.created_at)}</span>
                      </div>
                      <span className="font-medium">{formatAmount(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transfers */}
            {earningsData.recent_transfers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Transfers to You</h4>
                <div className="space-y-2">
                  {earningsData.recent_transfers.slice(0, 3).map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                          {transfer.status}
                        </Badge>
                        <span className="text-sm">{formatDate(transfer.created_at)}</span>
                      </div>
                      <span className="font-medium">{formatAmount(transfer.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Refunds */}
            {earningsData.recent_refunds.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Refunds</h4>
                <div className="space-y-2">
                  {earningsData.recent_refunds.slice(0, 3).map((refund, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Refunded
                          </Badge>
                          <span className="text-sm">{formatDate(refund.cancelled_at)}</span>
                        </div>
                        {refund.cancellation_reason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {refund.cancellation_reason}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-red-600">-{formatAmount(refund.refund_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

        </>
        ) : (
          <p className="text-muted-foreground">
            No earnings data available yet. Complete your first tutoring session to see earnings here.
          </p>
        )}

        {/* Dashboard Access Button - Always show if user has account */}
        {accountStatus?.has_account && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleAccessDashboard}
              disabled={dashboardLoading}
              className="w-full"
              variant="default"
            >
              {dashboardLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Dashboard...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Stripe Dashboard
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Manage earnings, payouts, tax documents, and account settings
            </p>
          </div>
        )}

        {!accountStatus?.has_account && (
          <div className="pt-4 border-t">
            <p className="text-muted-foreground text-center">
              Set up your Stripe Connect account to start receiving payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};