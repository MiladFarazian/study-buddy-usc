import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, User, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface PendingTransfer {
  id: string;
  tutor_id: string;
  student_id: string;
  amount: number;
  status: string;
  created_at: string;
  transfer_id: string | null;
}

interface TutorInfo {
  id: string;
  first_name: string;
  last_name: string;
  stripe_connect_id: string;
  stripe_connect_onboarding_complete: boolean;
}

export const TransferTest = () => {
  const [pendingTransfers, setPendingTransfers] = useState<(PendingTransfer & { tutor: TutorInfo })[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTransfers, setProcessingTransfers] = useState<Set<string>>(new Set());

  const fetchPendingTransfers = async () => {
    setLoading(true);
    try {
      // First get pending transfers
      const { data: transfers, error: transfersError } = await supabase
        .from('pending_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (transfersError) {
        console.error('Error fetching pending transfers:', transfersError);
        toast.error('Failed to fetch pending transfers');
        return;
      }

      if (!transfers || transfers.length === 0) {
        setPendingTransfers([]);
        return;
      }

      // Get unique tutor IDs
      const tutorIds = [...new Set(transfers.map(t => t.tutor_id))];

      // Fetch tutor details
      const { data: tutors, error: tutorsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, stripe_connect_id, stripe_connect_onboarding_complete')
        .in('id', tutorIds);

      if (tutorsError) {
        console.error('Error fetching tutors:', tutorsError);
        toast.error('Failed to fetch tutor details');
        return;
      }

      // Create a map for quick tutor lookup
      const tutorMap = new Map(tutors?.map(t => [t.id, t]) || []);

      // Combine transfers with tutor data
      const transfersWithTutors = transfers
        .filter(transfer => tutorMap.has(transfer.tutor_id))
        .map(transfer => ({
          ...transfer,
          tutor: tutorMap.get(transfer.tutor_id)!
        }));

      setPendingTransfers(transfersWithTutors);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch pending transfers');
    } finally {
      setLoading(false);
    }
  };

  const processTransfer = async (tutorId: string) => {
    setProcessingTransfers(prev => new Set([...prev, tutorId]));
    
    try {
      const { data, error } = await supabase.functions.invoke('transfer-pending-funds', {
        body: { tutor_id: tutorId }
      });

      if (error) {
        console.error('Transfer error:', error);
        toast.error(`Transfer failed: ${error.message}`);
        return;
      }

      toast.success(`Transfer processing completed! ${data.transfers_processed} transfers processed.`);
      
      // Refresh the transfers list
      await fetchPendingTransfers();
      
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error('Transfer failed: Network error');
    } finally {
      setProcessingTransfers(prev => {
        const newSet = new Set(prev);
        newSet.delete(tutorId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading pending transfers...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transfer Testing Interface</h1>
        <Button onClick={fetchPendingTransfers} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pending Transfers ({pendingTransfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending transfers found
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransfers.map((transfer) => (
                <Card key={transfer.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">
                            {transfer.tutor?.first_name} {transfer.tutor?.last_name}
                          </span>
                          {getStatusBadge(transfer.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Amount: <span className="font-mono">{formatCurrency(transfer.amount)}</span></div>
                          <div>Created: {formatDate(transfer.created_at)}</div>
                          <div>Transfer ID: <span className="font-mono text-xs">{transfer.id}</span></div>
                          {transfer.tutor?.stripe_connect_id && (
                            <div>Stripe Connect: <span className="font-mono text-xs">{transfer.tutor.stripe_connect_id}</span></div>
                          )}
                        </div>

                        {!transfer.tutor?.stripe_connect_onboarding_complete && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Stripe Connect Not Complete
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {transfer.status === 'pending' && transfer.tutor?.stripe_connect_onboarding_complete && (
                          <Button
                            onClick={() => processTransfer(transfer.tutor_id)}
                            disabled={processingTransfers.has(transfer.tutor_id)}
                            size="sm"
                          >
                            {processingTransfers.has(transfer.tutor_id) ? 'Processing...' : 'Process Transfer'}
                          </Button>
                        )}
                        
                        {transfer.status === 'completed' && transfer.transfer_id && (
                          <Badge variant="outline" className="text-xs">
                            Stripe: {transfer.transfer_id.substring(0, 12)}...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingTransfers.some(t => t.status === 'pending') && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Transfer Notes:</div>
                <ul className="mt-1 space-y-1 text-orange-700">
                  <li>• Only tutors with completed Stripe Connect onboarding can receive transfers</li>
                  <li>• Transfers are grouped by tutor and processed together</li>
                  <li>• Processing may take a few seconds to complete</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};