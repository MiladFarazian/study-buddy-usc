
import { supabase } from "@/integrations/supabase/client";

// Re-export from scheduling-utils
export { createSessionBooking, createPaymentTransaction } from '@/lib/scheduling-utils';

// Helper function to create a stripe payment intent
export const createStripePaymentIntent = async (
  sessionId: string,
  amount: number,
  tutorId: string,
  studentId: string,
  description: string
) => {
  try {
    const response = await supabase.functions.invoke('create-payment-intent', {
      body: {
        sessionId,
        amount, // in cents
        tutorId,
        studentId,
        description
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Update a session status
export const updateSessionStatus = async (
  sessionId: string,
  status: 'pending' | 'confirmed' | 'cancelled'
) => {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating session status:', error);
    return false;
  }
};

// Update a payment transaction status
export const updatePaymentStatus = async (
  sessionId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  stripePaymentIntentId?: string
) => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (stripePaymentIntentId) {
      updateData.stripe_payment_intent_id = stripePaymentIntentId;
    }

    const { error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('session_id', sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
};
