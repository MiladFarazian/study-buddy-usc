
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the stripe secret key and webhook secret from environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !endpointSecret) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration missing. Please set STRIPE_CONNECT_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Supabase edge function secrets.' 
        }),
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature provided' }), {
        status: 400,
      });
    }

    // Get the request body as text
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
      });
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event based on its type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabaseAdmin);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabaseAdmin);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object, supabaseAdmin);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object, supabaseAdmin);
        break;
        
      case 'charge.succeeded':
        // You might want to handle this event for additional logging
        console.log(`Charge succeeded: ${event.data.object.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
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

async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  console.log(`Payment successful! PaymentIntent ID: ${paymentIntent.id}`);
  
  // Extract metadata
  const { sessionId, tutorId, studentId } = paymentIntent.metadata || {};
  
  if (!sessionId) {
    console.error('No sessionId found in payment metadata');
    return;
  }
  
  // Update the session status
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
    
  if (sessionError) {
    console.error('Error updating session:', sessionError);
  } else {
    console.log(`Session ${sessionId} marked as confirmed and paid`);
  }
  
  // Find and update the payment transaction
  const { data: transactions, error: txError } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();
    
  if (txError) {
    console.error('Error finding payment transaction:', txError);
  } else if (transactions) {
    // Update payment transaction status
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        payment_intent_status: paymentIntent.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactions.id);
      
    if (updateError) {
      console.error('Error updating payment transaction:', updateError);
    } else {
      console.log(`Payment transaction ${transactions.id} marked as completed`);
    }
  } else {
    console.log('No matching transaction found, creating a new record');
    
    // Create a new transaction record if one doesn't exist
    const { error: createError } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        status: 'completed',
        payment_intent_status: paymentIntent.status,
        tutor_id: tutorId,
        student_id: studentId,
      });
      
    if (createError) {
      console.error('Error creating payment transaction:', createError);
    } else {
      console.log('Created new payment transaction record');
    }
  }
  
  // Create notifications for both parties
  if (tutorId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: tutorId,
          type: 'payment_received',
          title: 'Payment Received',
          message: `You have received a payment for session #${sessionId.slice(0, 8)}`,
          metadata: {
            sessionId,
            amount: paymentIntent.amount / 100
          }
        });
        
      console.log(`Notification sent to tutor ${tutorId}`);
    } catch (notifyError) {
      console.error('Error creating tutor notification:', notifyError);
    }
  }
  
  if (studentId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Your payment for session #${sessionId.slice(0, 8)} has been processed successfully.`,
          metadata: {
            sessionId,
            amount: paymentIntent.amount / 100
          }
        });
        
      console.log(`Notification sent to student ${studentId}`);
    } catch (notifyError) {
      console.error('Error creating student notification:', notifyError);
    }
  }
}

async function handlePaymentIntentFailed(failedPayment: any, supabase: any) {
  console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
  
  // Update payment transaction status
  const { data: failedTx, error: failedTxError } = await supabase
    .from('payment_transactions')
    .select('id, session_id')
    .eq('stripe_payment_intent_id', failedPayment.id)
    .single();
    
  if (failedTxError) {
    console.error('Error finding failed payment transaction:', failedTxError);
  } else if (failedTx) {
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        payment_intent_status: failedPayment.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', failedTx.id);
      
    // Update session status
    if (failedTx.session_id) {
      await supabase
        .from('sessions')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', failedTx.session_id);
    }
  }
  
  // Create notification for the student about failed payment
  if (failedPayment.metadata?.studentId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: failedPayment.metadata.studentId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment could not be processed. ${failedPayment.last_payment_error?.message || 'Please try again or use a different payment method.'}`,
          metadata: {
            sessionId: failedPayment.metadata.sessionId,
            error: failedPayment.last_payment_error?.message || 'Unknown error'
          }
        });
    } catch (notifyError) {
      console.error('Error creating payment failure notification:', notifyError);
    }
  }
}

async function handleAccountUpdated(account: any, supabase: any) {
  console.log(`Stripe Connect account updated: ${account.id}`);
  
  // Update the user's Stripe Connect onboarding status
  if (account.metadata?.user_id) {
    const onboardingComplete = account.details_submitted && account.payouts_enabled;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_connect_onboarding_complete: onboardingComplete,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.metadata.user_id);
      
    if (updateError) {
      console.error('Error updating profile onboarding status:', updateError);
    } else {
      console.log(`Updated onboarding status for user ${account.metadata.user_id} to ${onboardingComplete}`);
      
      // Create notification for the tutor about onboarding status
      if (onboardingComplete) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: account.metadata.user_id,
              type: 'connect_onboarding_complete',
              title: 'Payment Account Setup Complete',
              message: 'Your payment account setup is complete. You can now receive payments from students.',
              metadata: {
                stripeAccountId: account.id
              }
            });
        } catch (notifyError) {
          console.error('Error creating onboarding notification:', notifyError);
        }
      }
    }
  }
}

async function handleTransferCreated(transfer: any, supabase: any) {
  console.log(`Transfer created: ${transfer.id}`);
  
  if (transfer.metadata?.payment_id && transfer.metadata?.session_id) {
    // Update payment transfer record
    const { error: transferError } = await supabase
      .from('payment_transfers')
      .upsert({
        payment_id: transfer.metadata.payment_id,
        transfer_id: transfer.id,
        status: 'completed',
        transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        amount: transfer.amount / 100,
        tutor_id: transfer.metadata.tutor_id,
        session_id: transfer.metadata.session_id
      }, {
        onConflict: 'payment_id'
      });
      
    if (transferError) {
      console.error('Error upserting payment transfer:', transferError);
    } else {
      console.log(`Updated transfer record for payment ${transfer.metadata.payment_id}`);
    }
    
    // Update payment transaction with transfer status
    const { error: paymentUpdateError } = await supabase
      .from('payment_transactions')
      .update({
        transfer_status: 'completed',
        transfer_id: transfer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', transfer.metadata.payment_id);
      
    if (paymentUpdateError) {
      console.error('Error updating payment transaction with transfer status:', paymentUpdateError);
    }
    
    // Send notification to tutor about funds transferred
    if (transfer.metadata.tutor_id) {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: transfer.metadata.tutor_id,
            type: 'funds_transferred',
            title: 'Funds Transferred',
            message: `Funds for session #${transfer.metadata.session_id.slice(0, 8)} have been transferred to your account.`,
            metadata: {
              sessionId: transfer.metadata.session_id,
              amount: transfer.amount / 100,
              transfer_id: transfer.id
            }
          });
      } catch (notifyError) {
        console.error('Error creating tutor transfer notification:', notifyError);
      }
    }
  }
}
