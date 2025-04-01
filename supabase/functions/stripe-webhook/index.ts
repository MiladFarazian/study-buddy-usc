
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature provided' }), {
      status: 400,
    });
  }

  try {
    // Get the request body as text
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
      });
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent ${paymentIntent.id} was successful!`);
        
        // Update session and payment status
        if (paymentIntent.metadata.sessionId) {
          // Update the session status
          const { error: sessionError } = await supabaseAdmin
            .from('sessions')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.metadata.sessionId);
            
          if (sessionError) {
            console.error('Error updating session:', sessionError);
          }
          
          // Find and update the payment transaction
          const { data: transactions, error: txError } = await supabaseAdmin
            .from('payment_transactions')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .single();
            
          if (txError) {
            console.error('Error finding payment transaction:', txError);
          } else if (transactions) {
            // Update payment transaction status
            const { error: updateError } = await supabaseAdmin
              .from('payment_transactions')
              .update({
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', transactions.id);
              
            if (updateError) {
              console.error('Error updating payment transaction:', updateError);
            }
          }
          
          // Create notification for the tutor
          if (paymentIntent.metadata.tutorId) {
            const { error: notifyError } = await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: paymentIntent.metadata.tutorId,
                type: 'booking_confirmed',
                title: 'New Booking Confirmed',
                message: `A new session has been booked and paid for.`,
                metadata: {
                  sessionId: paymentIntent.metadata.sessionId,
                  amount: paymentIntent.amount / 100
                }
              });
              
            if (notifyError) {
              console.error('Error creating tutor notification:', notifyError);
            }
          }
          
          // Create confirmation notification for the student
          if (paymentIntent.metadata.studentId) {
            const { error: studentNotifyError } = await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: paymentIntent.metadata.studentId,
                type: 'payment_success',
                title: 'Payment Successful',
                message: `Your payment for the tutoring session has been processed.`,
                metadata: {
                  sessionId: paymentIntent.metadata.sessionId,
                  amount: paymentIntent.amount / 100
                }
              });
              
            if (studentNotifyError) {
              console.error('Error creating student notification:', studentNotifyError);
            }
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
        
        // Update payment transaction status
        const { error: paymentError } = await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id);
          
        if (paymentError) {
          console.error('Error updating payment transaction:', paymentError);
        }
        
        // Create notification for the student about failed payment
        if (failedPayment.metadata.studentId) {
          const { error: notifyError } = await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: failedPayment.metadata.studentId,
              type: 'payment_failed',
              title: 'Payment Failed',
              message: `Your payment for the tutoring session could not be processed.`,
              metadata: {
                sessionId: failedPayment.metadata.sessionId,
                error: failedPayment.last_payment_error?.message || 'Unknown error'
              }
            });
            
          if (notifyError) {
            console.error('Error creating payment failure notification:', notifyError);
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
});
