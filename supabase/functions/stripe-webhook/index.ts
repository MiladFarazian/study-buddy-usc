import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log(`Payment intent succeeded: ${paymentIntent.id}`);

      // Update payment transaction in database
      const { error: updateError } = await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'completed',
          payment_intent_status: 'succeeded',
          charge_id: paymentIntent.latest_charge,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (updateError) {
        console.error('Error updating payment transaction:', updateError);
        return new Response('Failed to update payment transaction', { status: 500 });
      }

      // Update associated session payment status
      const { error: sessionError } = await supabaseAdmin
        .from('sessions')
        .update({ payment_status: 'paid' })
        .in('id', (
          await supabaseAdmin
            .from('payment_transactions')
            .select('session_id')
            .eq('stripe_payment_intent_id', paymentIntent.id)
        ).data?.map(p => p.session_id) || []);

      if (sessionError) {
        console.error('Error updating session payment status:', sessionError);
      }

      console.log(`Successfully processed payment_intent.succeeded for: ${paymentIntent.id}`);
    }

    // Handle transfer.paid event
    if (event.type === 'transfer.paid') {
      const transfer = event.data.object as Stripe.Transfer;
      
      console.log(`Transfer completed: ${transfer.id}`);

      // Update pending_transfers table
      const { error: transferError } = await supabaseAdmin
        .from('pending_transfers')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('transfer_id', transfer.id);

      if (transferError) {
        console.error('Error updating transfer status:', transferError);
      }

      console.log(`Successfully processed transfer.paid for: ${transfer.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});