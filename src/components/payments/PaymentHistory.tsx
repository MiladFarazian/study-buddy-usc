import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Receipt, Search, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_completed_at: string | null;
  session_id: string | null;
  tutor_id: string | null;
  environment: string | null;
  sessions?: {
    start_time: string;
    end_time: string;
    course_id: string | null;
    session_type: string;
    location: string | null;
  } | null;
  tutor?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export const PaymentHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          sessions:session_id (
            start_time,
            end_time,
            course_id,
            session_type,
            location
          ),
          tutor:tutor_id (
            first_name,
            last_name
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: "Error loading payments",
          description: "Failed to load your payment history. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setTransactions((data as any) || []);
    } catch (error) {
      console.error('Error in loadTransactions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading payments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateReceipt = (transaction: PaymentTransaction) => {
    const receiptContent = `
TUTORING SESSION RECEIPT
========================

Transaction ID: ${transaction.id}
Date: ${formatDate(transaction.created_at)}
Amount: ${formatAmount(transaction.amount)}
Status: ${transaction.status.toUpperCase()}

${transaction.tutor ? `Tutor: ${transaction.tutor.first_name} ${transaction.tutor.last_name}` : ''}
${transaction.sessions ? `Session: ${formatDateTime(transaction.sessions.start_time)}` : ''}
${transaction.sessions?.course_id ? `Course: ${transaction.sessions.course_id}` : ''}
${transaction.sessions?.session_type ? `Type: ${transaction.sessions.session_type}` : ''}
${transaction.sessions?.location ? `Location: ${transaction.sessions.location}` : ''}

Payment completed: ${transaction.payment_completed_at ? formatDateTime(transaction.payment_completed_at) : 'Pending'}
Environment: ${transaction.environment === 'live' ? 'Production' : 'Test Mode'}

Thank you for using our tutoring platform!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${transaction.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt downloaded",
      description: "Your receipt has been downloaded successfully.",
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.status.toLowerCase().includes(searchLower) ||
      (transaction.tutor?.first_name?.toLowerCase().includes(searchLower)) ||
      (transaction.tutor?.last_name?.toLowerCase().includes(searchLower)) ||
      (transaction.sessions?.course_id?.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading payment history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
            >
              Refresh
            </Button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No transactions found matching your search.' : 'No payments found yet.'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Your tutoring session payments will appear here.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatAmount(transaction.amount)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(transaction.status)}
                      >
                        {transaction.status}
                      </Badge>
                      {transaction.environment === 'test' && (
                        <Badge variant="outline" className="text-xs">
                          Test
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(transaction.created_at)}
                      </div>
                    </div>

                    {transaction.tutor && (
                      <div className="text-sm text-muted-foreground">
                        Tutor: {transaction.tutor.first_name} {transaction.tutor.last_name}
                      </div>
                    )}

                    {transaction.sessions && (
                      <div className="text-sm text-muted-foreground">
                        Session: {formatDateTime(transaction.sessions.start_time)}
                        {transaction.sessions.course_id && ` • ${transaction.sessions.course_id}`}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateReceipt(transaction)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};