import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { paymentIntentId, sessionId } = await req.json();

    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'Payment Intent ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Syncing payment status for payment intent: ${paymentIntentId}`);

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log(`Payment intent status: ${paymentIntent.status}`);

    // Update database based on Stripe status
    const updateData: any = {
      payment_intent_status: paymentIntent.status,
      updated_at: new Date().toISOString(),
    };

    // If payment succeeded, capture charge ID and update status
    if (paymentIntent.status === 'succeeded') {
      updateData.status = 'completed';
      updateData.charge_id = paymentIntent.latest_charge;
      console.log(`Payment succeeded with charge ID: ${paymentIntent.latest_charge}`);
    } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'payment_failed') {
      updateData.status = 'failed';
      console.log(`Payment failed with status: ${paymentIntent.status}`);
    }

    // Update payment transaction
    const { error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update(updateData)
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      console.error('Error updating payment transaction:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update payment transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If sessionId provided, also update session payment status
    if (sessionId && paymentIntent.status === 'succeeded') {
      await supabaseAdmin
        .from('sessions')
        .update({ payment_status: 'paid' })
        .eq('id', sessionId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      paymentStatus: paymentIntent.status,
      chargeId: paymentIntent.latest_charge,
      updated: updateData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error syncing payment status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});