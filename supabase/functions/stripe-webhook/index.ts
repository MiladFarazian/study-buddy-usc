
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_CONNECT_SECRET_KEY') || '', {
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

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment successful! PaymentIntent ID: ${paymentIntent.id}`);
        
        // Extract metadata
        const { sessionId, tutorId, studentId } = paymentIntent.metadata || {};
        
        if (!sessionId) {
          console.error('No sessionId found in payment metadata');
          return new Response(JSON.stringify({ error: 'No sessionId in metadata' }), { status: 400 });
        }
        
        // Update the session status
        const { error: sessionError } = await supabaseAdmin
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
          const { error: createError } = await supabaseAdmin
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
            await supabaseAdmin
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
            await supabaseAdmin
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
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
        
        // Update payment transaction status
        const { data: failedTx, error: failedTxError } = await supabaseAdmin
          .from('payment_transactions')
          .select('id, session_id')
          .eq('stripe_payment_intent_id', failedPayment.id)
          .single();
          
        if (failedTxError) {
          console.error('Error finding failed payment transaction:', failedTxError);
        } else if (failedTx) {
          // Update transaction status
          await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'failed',
              payment_intent_status: failedPayment.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', failedTx.id);
            
          // Update session status
          if (failedTx.session_id) {
            await supabaseAdmin
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
            await supabaseAdmin
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
        break;

      case 'account.updated':
        const account = event.data.object;
        console.log(`Stripe Connect account updated: ${account.id}`);
        
        // Update the user's Stripe Connect onboarding status
        if (account.metadata?.user_id) {
          const onboardingComplete = account.details_submitted && account.payouts_enabled;
          
          const { error: updateError } = await supabaseAdmin
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
          }
        }
        break;

      case 'transfer.created':
        const transfer = event.data.object;
        console.log(`Transfer created: ${transfer.id}`);
        
        if (transfer.metadata?.payment_id && transfer.metadata?.session_id) {
          // Update payment transfer record
          const { error: transferError } = await supabaseAdmin
            .from('payment_transfers')
            .update({
              transfer_id: transfer.id,
              status: 'completed',
              transferred_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('payment_id', transfer.metadata.payment_id);
            
          if (transferError) {
            console.error('Error updating payment transfer:', transferError);
          } else {
            console.log(`Updated transfer record for payment ${transfer.metadata.payment_id}`);
          }
          
          // Update payment transaction with transfer status
          const { error: paymentUpdateError } = await supabaseAdmin
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
              await supabaseAdmin
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
