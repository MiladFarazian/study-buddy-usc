
import { supabase } from "@/integrations/supabase/client";

// Create a payment transaction for a session
export async function createPaymentTransaction(
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number
) {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating payment transaction:", error);
    throw error;
  }
}

// Update payment transaction with Stripe payment intent ID
export async function updatePaymentTransactionWithStripe(
  transactionId: string,
  stripePaymentIntentId: string
) {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'processing'
      })
      .eq('id', transactionId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating payment transaction:", error);
    return false;
  }
}

// Mark payment as completed
export async function markPaymentComplete(
  transactionId: string,
  sessionId: string
) {
  try {
    // Update payment transaction
    const { error: paymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);
      
    if (paymentError) throw paymentError;
    
    // Update session payment status
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
      
    if (sessionError) throw sessionError;
    
    return true;
  } catch (error) {
    console.error("Error marking payment complete:", error);
    return false;
  }
}
