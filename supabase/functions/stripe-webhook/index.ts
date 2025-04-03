
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
    // Get Stripe webhook secret
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return new Response(
        JSON.stringify({ error: 'Webhook secret missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Get Stripe API key
    const stripeSecretKey = Deno.env.get('STRIPE_CONNECT_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_CONNECT_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Stripe API key missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing Stripe signature header');
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get the raw body as text
    const rawBody = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    console.log(`Processing webhook event: ${event.type} with id: ${event.id}`);

    // Handle different events
    switch (event.type) {
      case 'account.updated': {
        // Handle Connect account update events
        const account = event.data.object;
        const userId = account.metadata?.user_id;
        
        console.log(`Processing account.updated for user_id: ${userId || 'unknown'}, account_id: ${account.id}`);
        
        if (userId && account.id) {
          // Check if all requirements are met
          const isComplete = 
            account.charges_enabled === true && 
            account.payouts_enabled === true &&
            account.details_submitted === true;
          
          console.log(`Account status: charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}, details_submitted=${account.details_submitted}`);
          
          // Update the user's profile
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_connect_onboarding_complete: isComplete,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .eq('stripe_connect_id', account.id);
          
          if (updateError) {
            console.error('Error updating tutor Connect status:', updateError);
          } else {
            console.log(`Updated Connect onboarding status for user ${userId} to ${isComplete}`);
          }
        } else {
          console.warn(`Missing metadata.user_id for account: ${account.id}`);
        }
        break;
      }
      
      case 'account.application.deauthorized': {
        // Handle when a user disconnects the Stripe Connect integration
        const account = event.data.object;
        
        // Find the user by their Connect account ID
        const { data: profiles, error: findError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_connect_id', account.id);
        
        if (findError) {
          console.error('Error finding user with deauthorized Connect account:', findError);
        } else if (profiles && profiles.length > 0) {
          const userId = profiles[0].id;
          
          // Update the user's profile to clear the Connect info
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_connect_id: null,
              stripe_connect_onboarding_complete: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
          
          if (updateError) {
            console.error('Error updating user after Connect deauthorization:', updateError);
          } else {
            console.log(`Updated user ${userId} after Connect deauthorization`);
          }
        } else {
          console.warn(`No user found with Connect account: ${account.id}`);
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        // Handle payment intent success
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.sessionId;
        
        console.log(`Payment intent succeeded: ${paymentIntent.id} for session: ${sessionId || 'unknown'}`);
        
        if (sessionId) {
          // Update payment transaction status
          const { error: updateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'succeeded',
              payment_intent_status: paymentIntent.status,
              updated_at: new Date().toISOString()
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);
          
          if (updateError) {
            console.error('Error updating payment status:', updateError);
          } else {
            console.log(`Updated payment status for intent ${paymentIntent.id} to succeeded`);
            
            // Also update the session status
            const { error: sessionError } = await supabaseAdmin
              .from('sessions')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                updated_at: new Date().toISOString()
              })
              .eq('id', sessionId);
            
            if (sessionError) {
              console.error('Error updating session payment status:', sessionError);
            } else {
              console.log(`Updated session ${sessionId} payment status to paid`);
            }
          }
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        // Handle payment failure
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.sessionId;
        
        console.log(`Payment intent failed: ${paymentIntent.id} for session: ${sessionId || 'unknown'}`);
        
        if (sessionId) {
          // Update payment transaction status
          const { error: updateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
              status: 'failed',
              payment_intent_status: paymentIntent.status,
              updated_at: new Date().toISOString(),
              error_message: paymentIntent.last_payment_error?.message || 'Payment failed'
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);
          
          if (updateError) {
            console.error('Error updating payment status:', updateError);
          } else {
            console.log(`Updated payment status for intent ${paymentIntent.id} to failed`);
          }
        }
        break;
      }
      
      case 'charge.succeeded': {
        // Handle successful charge
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        
        console.log(`Charge succeeded: ${charge.id} for payment intent: ${paymentIntentId || 'unknown'}`);
        
        if (paymentIntentId) {
          // Find the related payment transaction
          const { data: transaction, error: txError } = await supabaseAdmin
            .from('payment_transactions')
            .select('id, session_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle();
          
          if (txError) {
            console.error('Error finding transaction for charge:', txError);
          } else if (transaction) {
            // Update with charge details
            const { error: updateError } = await supabaseAdmin
              .from('payment_transactions')
              .update({
                charge_id: charge.id,
                charge_status: charge.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id);
            
            if (updateError) {
              console.error('Error updating charge details:', updateError);
            } else {
              console.log(`Updated transaction ${transaction.id} with charge ID ${charge.id}`);
            }
          }
        }
        break;
      }
      
      case 'transfer.created':
      case 'transfer.paid': {
        // Handle transfer to connected account
        const transfer = event.data.object;
        const transferGroup = transfer.transfer_group;
        
        console.log(`Transfer ${event.type}: ${transfer.id}, group: ${transferGroup || 'none'}, amount: ${transfer.amount}`);
        
        if (transferGroup && transferGroup.startsWith('session_')) {
          const sessionId = transferGroup.replace('session_', '');
          
          // Find the related payment transaction
          const { data: transaction, error: txError } = await supabaseAdmin
            .from('payment_transactions')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle();
          
          if (txError) {
            console.error('Error finding transaction for transfer:', txError);
          } else if (transaction) {
            // Update transfer status
            const { error: updateError } = await supabaseAdmin
              .from('payment_transfers')
              .update({
                status: event.type === 'transfer.paid' ? 'paid' : 'pending',
                transfer_id: transfer.id,
                updated_at: new Date().toISOString()
              })
              .eq('payment_id', transaction.id);
            
            if (updateError) {
              // If no record exists, create one
              const { error: insertError } = await supabaseAdmin
                .from('payment_transfers')
                .insert({
                  payment_id: transaction.id,
                  session_id: sessionId,
                  transfer_id: transfer.id,
                  amount: transfer.amount / 100, // Convert cents to dollars
                  status: event.type === 'transfer.paid' ? 'paid' : 'pending',
                  transferred_at: new Date().toISOString()
                });
              
              if (insertError) {
                console.error('Error creating transfer record:', insertError);
              } else {
                console.log(`Created transfer record for session ${sessionId}`);
              }
            } else {
              console.log(`Updated transfer record for session ${sessionId}`);
            }
          }
        }
        break;
      }
      
      case 'account.external_account.created':
      case 'account.external_account.updated': {
        // Handle when a Connect account adds or updates a bank account
        const externalAccount = event.data.object;
        const accountId = externalAccount.account;
        
        console.log(`External account ${event.type}: ${externalAccount.id} for account: ${accountId}`);
        
        // Find the user by their Connect account ID
        const { data: profiles, error: findError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_connect_id', accountId);
        
        if (findError) {
          console.error('Error finding user with external account update:', findError);
        } else if (profiles && profiles.length > 0) {
          console.log(`Found user ${profiles[0].id} for external account update`);
          // You might want to update some status in your database if needed
        }
        break;
      }
    }

    // Return a success response
    return new Response(
      JSON.stringify({ received: true, event_id: event.id, event_type: event.type }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error processing webhook' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
