import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.13.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Check for required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Validate all required environment variables are present
    const missingEnvVars = [];
    if (!stripeSecretKey) missingEnvVars.push('STRIPE_CONNECT_SECRET_KEY');
    if (!webhookSecret) missingEnvVars.push('STRIPE_WEBHOOK_SECRET');
    if (!supabaseUrl) missingEnvVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingEnvVars.length > 0) {
      console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      return new Response(
        JSON.stringify({ 
          error: `Missing required environment variables: ${missingEnvVars.join(', ')}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false
        }
      }
    );

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      console.error('Missing Stripe-Signature header');
      return new Response('Missing Stripe-Signature header', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(err.message, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Process the webhook event
    let result = { success: true, message: 'No action needed' };

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

        // Update payment_transactions record
        const { error: paymentUpdateError } = await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'completed',
            payment_intent_status: paymentIntent.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (paymentUpdateError) {
          console.error('Error updating payment transaction:', paymentUpdateError);
          result.message = `Payment recorded but database update failed: ${paymentUpdateError.message}`;
        } else {
          result.message = `Payment ${paymentIntent.id} recorded successfully`;
        }

        // Update session status
        const sessionId = paymentIntent.metadata?.sessionId;
        if (sessionId) {
          const { error: sessionUpdateError } = await supabaseAdmin
            .from('sessions')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);

          if (sessionUpdateError) {
            console.error('Error updating session status:', sessionUpdateError);
          } else {
            console.log(`Updated session ${sessionId} status to confirmed`);
          }
        }
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Charge succeeded: ${charge.id}`);

        // Update payment_transactions record with charge ID
        const { error: chargeUpdateError } = await supabaseAdmin
          .from('payment_transactions')
          .update({
            charge_id: charge.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        if (chargeUpdateError) {
          console.error('Error updating payment transaction with charge ID:', chargeUpdateError);
        } else {
          result.message = `Charge ${charge.id} recorded successfully`;
        }
        break;

      case 'account.updated':
        result = await handleAccountUpdated(event, stripe, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({
      ...result,
      received: true,
      event: event.type
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error processing webhook',
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Keep the existing handleAccountUpdated function
async function handleAccountUpdated(event, stripe, supabaseAdmin) {
  const account = event.data.object;
  
  // Check if this is a connect account that just completed onboarding
  if (account.details_submitted && account.payouts_enabled) {
    console.log(`Connect account ${account.id} has completed onboarding`);
    
    // Find the tutor associated with this connect account
    const { data: tutorProfiles, error: tutorError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('stripe_connect_id', account.id)
      .eq('stripe_connect_onboarding_complete', false);
      
    if (tutorError || !tutorProfiles || tutorProfiles.length === 0) {
      console.log('No tutor found for this Connect account or tutor already marked as complete');
      return { success: true, message: 'No action needed' };
    }
    
    // Update tutor profile to mark onboarding as complete
    for (const tutor of tutorProfiles) {
      // Update the tutor's profile
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          stripe_connect_onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', tutor.id);
        
      if (updateError) {
        console.error(`Error updating tutor profile ${tutor.id}:`, updateError);
        continue;
      }
      
      console.log(`Updated tutor ${tutor.id} to mark Stripe Connect onboarding as complete`);
      
      // Process any pending transfers for this tutor
      try {
        // Get pending transfers for this tutor
        const { data: pendingTransfers, error: transfersError } = await supabaseAdmin
          .from('pending_transfers')
          .select('*')
          .eq('tutor_id', tutor.id)
          .eq('status', 'pending');
          
        if (transfersError) {
          console.error(`Error retrieving pending transfers for tutor ${tutor.id}:`, transfersError);
          continue;
        }
        
        if (!pendingTransfers || pendingTransfers.length === 0) {
          console.log(`No pending transfers found for tutor ${tutor.id}`);
          continue;
        }
        
        console.log(`Processing ${pendingTransfers.length} pending transfers for tutor ${tutor.id}`);
        
        // Process each pending transfer
        for (const transfer of pendingTransfers) {
          try {
            // Create a transfer to the tutor's connect account
            const newTransfer = await stripe.transfers.create({
              amount: Math.round(transfer.amount * 100), // Convert to cents
              currency: 'usd',
              destination: account.id,
              transfer_group: transfer.transfer_group,
              metadata: {
                session_id: transfer.session_id,
                tutor_id: transfer.tutor_id,
                student_id: transfer.student_id,
                payment_transaction_id: transfer.payment_transaction_id,
                pending_transfer_id: transfer.id,
                processed_by: 'webhook'
              },
              description: `Automatic tutor payment for session ${transfer.session_id}`
            });
            
            // Update the pending transfer record
            await supabaseAdmin
              .from('pending_transfers')
              .update({
                status: 'completed',
                transfer_id: newTransfer.id,
                processed_at: new Date().toISOString(),
                processor: 'webhook'
              })
              .eq('id', transfer.id);
              
            console.log(`Completed transfer ${transfer.id} for tutor ${tutor.id}: ${newTransfer.id}`);
          } catch (error) {
            console.error(`Error processing transfer ${transfer.id}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing transfers for tutor ${tutor.id}:`, error);
      }
    }
    
    return { 
      success: true, 
      message: `Updated ${tutorProfiles.length} tutor profiles and processed pending transfers` 
    };
  }
  
  return { success: true, message: 'No action needed for this account update' };
}
