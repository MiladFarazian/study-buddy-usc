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
  recent_transfers: Array<{
    amount: number;
    created_at: string;
    status: string;
    session_id: string | null;
  }>;
  pending_amount: number;
  total_earned: number;
  this_month_earned: number;
}

export const TutorEarningsSummary: React.FC<TutorEarningsSummaryProps> = ({ user, accountStatus }) => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && accountStatus?.payouts_enabled) {
      fetchEarningsData();
    } else {
      setLoading(false);
    }
  }, [user, accountStatus]);

  const fetchEarningsData = async () => {
    if (!user) return;

    try {
      // Fetch recent transfers
      const { data: transfers, error: transferError } = await supabase
        .from('pending_transfers')
        .select('amount, created_at, status, session_id')
        .eq('tutor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transferError) {
        console.error('Error fetching transfers:', transferError);
        toast({
          title: "Error",
          description: "Failed to load earnings data",
          variant: "destructive",
        });
        return;
      }

      // Calculate totals
      const completedTransfers = transfers?.filter(t => t.status === 'completed') || [];
      const pendingTransfers = transfers?.filter(t => t.status === 'pending') || [];
      
      const totalEarned = completedTransfers.reduce((sum, t) => sum + (t.amount / 100), 0);
      const pendingAmount = pendingTransfers.reduce((sum, t) => sum + (t.amount / 100), 0);
      
      // Calculate this month's earnings
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthEarned = completedTransfers
        .filter(t => new Date(t.created_at) >= thisMonth)
        .reduce((sum, t) => sum + (t.amount / 100), 0);

      setEarningsData({
        recent_transfers: transfers || [],
        pending_amount: pendingAmount,
        total_earned: totalEarned,
        this_month_earned: thisMonthEarned
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
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!accountStatus?.payouts_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete your Stripe Connect account setup to view earnings and payout history.
          </p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="grid grid-cols-3 gap-4">
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
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{formatAmount(earningsData.total_earned)}</div>
                <div className="text-xs text-muted-foreground">Total Earned</div>
              </div>
            </div>

            {/* Recent Transfers */}
            {earningsData.recent_transfers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Transfers</h4>
                <div className="space-y-2">
                  {earningsData.recent_transfers.slice(0, 3).map((transfer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                          {transfer.status}
                        </Badge>
                        <span className="text-sm">{formatDate(transfer.created_at)}</span>
                      </div>
                      <span className="font-medium">{formatAmount(transfer.amount / 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Access Button */}
            <div className="pt-2 border-t">
              <Button 
                onClick={handleAccessDashboard}
                disabled={dashboardLoading}
                className="w-full"
                variant="outline"
              >
                {dashboardLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Dashboard...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Access Full Stripe Dashboard
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                View detailed earnings, update bank information, and manage payouts
              </p>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">
            No earnings data available yet. Complete your first tutoring session to see earnings here.
          </p>
        )}
      </CardContent>
    </Card>
  );
};