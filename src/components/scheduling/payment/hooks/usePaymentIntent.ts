import { useState, useEffect } from 'react';
import { usePaymentSetup } from '@/components/scheduling/booking-modal/hooks/usePaymentSetup';
import { BookingSlot } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';

/**
 * Hook for managing the payment intent process
 */
export function usePaymentIntent(
  selectedSlot: BookingSlot | null,
  tutor: Tutor | null
) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { user } = useAuthState();
  const { setupPayment, clientSecret, paymentError, isTwoStagePayment, isProcessing } = usePaymentSetup();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Load user info if available
  useEffect(() => {
    if (user) {
      setName(user?.user_metadata?.name || '');
      setEmail(user?.email || '');
    }
  }, [user]);
  
  // Function to handle setting up the payment
  const handleSetupPayment = async () => {
    if (!selectedSlot || !tutor || !user) {
      console.error("Missing data for payment setup");
      toast.error("Missing data for payment setup");
      return;
    }
    
    setPaymentStatus('loading');
    
    try {
      const amount = tutor.hourlyRate || 25; // Default to $25 if no rate
      const sessionId = selectedSlot.id;
      
      if (!sessionId) {
        console.error("Session ID is missing");
        toast.error("Session ID is missing");
        setPaymentStatus('error');
        return;
      }
      
      // Call the setupPayment function from the usePaymentSetup hook
      const result = await setupPayment({
        sessionId: sessionId,
        amount: amount,
        tutor: tutor,
        user: user
      });
      
      if (result.success) {
        console.log('Payment setup successful');
        setPaymentStatus('success');
      } else {
        console.error('Payment setup failed');
        setPaymentStatus('error');
      }
    } catch (error: any) {
      console.error('Error setting up payment:', error);
      toast.error(error.message || 'Failed to setup payment');
      setPaymentStatus('error');
    }
  };
  
  return {
    name,
    setName,
    email,
    setEmail,
    handleSetupPayment,
    clientSecret,
    paymentError,
    isTwoStagePayment,
    paymentStatus,
    isProcessing
  };
}
