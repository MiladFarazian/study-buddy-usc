import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectAccountStatus {
  has_account: boolean;
  needs_onboarding: boolean;
  payouts_enabled: boolean;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  account_id?: string;
  environment: string;
}

export const useStripeConnect = () => {
  const { user, isTutor } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check Connect account status
  const checkAccountStatus = async () => {
    if (!user || !isTutor) return;

    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking Connect account:', error);
        toast({
          title: "Error checking account status",
          description: "Failed to check your Stripe Connect account status.",
          variant: "destructive",
        });
        return;
      }

      setAccountStatus(data);
    } catch (error) {
      console.error('Error in checkAccountStatus:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Create Connect account and get onboarding link
  const setupConnectAccount = async () => {
    if (!user || !isTutor) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating Connect account:', error);
        toast({
          title: "Account setup failed",
          description: error.message || "Failed to set up your Stripe Connect account.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        toast({
          title: "Setup incomplete",
          description: "Account link was not generated. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in setupConnectAccount:', error);
      toast({
        title: "Setup failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check account status on mount and when user changes
  useEffect(() => {
    if (user && isTutor) {
      checkAccountStatus();
    }
  }, [user, isTutor]);

  return {
    accountStatus,
    isChecking,
    loading,
    setupConnectAccount,
    checkAccountStatus,
  };
};