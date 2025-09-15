import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const StudentPaymentView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const openStripePortal = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Opening Stripe portal for user:', user.id);
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          returnUrl: window.location.href
        }
      });

      console.log('Portal response:', { data, error });

      if (error) {
        console.error('Error creating portal session:', error);
        
        // Check for specific Stripe configuration error
        if (error.message?.includes('configuration') || error.message?.includes('portal')) {
          toast({
            title: "Setup Required",
            description: "The Stripe billing portal needs to be configured. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to open payment portal. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.url) {
        console.log('Opening portal URL:', data.url);
        window.open(data.url, '_blank');
        toast({
          title: "Success",
          description: "Payment portal opened in a new tab.",
        });
      } else {
        toast({
          title: "Error",
          description: "No portal URL received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Payment History
            <Badge variant="outline">Stripe Portal</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Manage your payment methods, download receipts, and view all transactions through Stripe's secure portal.
          </p>
          
          <Button 
            onClick={openStripePortal}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening Portal...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Payment History in Stripe
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};