
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
    // Check if Stripe secret key is configured
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration missing. Please set the STRIPE_SECRET_KEY in Supabase edge function secrets.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { sessionId, amount, tutorId, studentId, description } = await req.json();

    // Validate required parameters
    if (!sessionId || !amount || !tutorId || !studentId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating payment intent for session ${sessionId} with amount ${amount}`);

    // Initialize Stripe
    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Check if there's an existing payment intent for this session
      const { data: existingTransactions } = await supabaseClient
        .from('payment_transactions')
        .select('stripe_payment_intent_id, status')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      let paymentIntent;
      
      if (existingTransactions && existingTransactions.length > 0 && 
          existingTransactions[0].status !== 'failed' && 
          existingTransactions[0].stripe_payment_intent_id) {
        
        console.log(`Found existing payment intent: ${existingTransactions[0].stripe_payment_intent_id}`);
        
        try {
          // Retrieve existing payment intent
          paymentIntent = await stripe.paymentIntents.retrieve(
            existingTransactions[0].stripe_payment_intent_id
          );
          
          // If payment intent is not in a terminal state, we can reuse it
          if (paymentIntent.status !== 'succeeded' && 
              paymentIntent.status !== 'canceled') {
            
            console.log(`Reusing existing payment intent in state: ${paymentIntent.status}`);
            
            // Update the payment intent if necessary
            if (paymentIntent.amount !== Math.round(amount * 100)) {
              paymentIntent = await stripe.paymentIntents.update(
                paymentIntent.id,
                { amount: Math.round(amount * 100) }
              );
            }
          } else {
            // Create a new one if the existing one is in a terminal state
            console.log(`Creating new payment intent as existing one is in terminal state: ${paymentIntent.status}`);
            paymentIntent = null;
          }
        } catch (error) {
          console.error('Error retrieving payment intent:', error);
          paymentIntent = null;
        }
      }
      
      // Create a new payment intent if we don't have a valid existing one
      if (!paymentIntent) {
        console.log('Creating new payment intent');
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
          currency: 'usd',
          metadata: {
            sessionId,
            tutorId,
            studentId,
          },
          description: description || `Tutoring session payment`,
        });
        
        console.log(`Created new payment intent: ${paymentIntent.id}`);
        
        // Create a new payment transaction record
        const { error: txError } = await supabaseClient
          .from('payment_transactions')
          .insert({
            session_id: sessionId,
            student_id: studentId,
            tutor_id: tutorId,
            amount: amount,
            status: 'processing',
            stripe_payment_intent_id: paymentIntent.id,
          });

        if (txError) {
          console.error('Error creating payment transaction:', txError);
        }
      } else {
        // Update existing payment transaction record
        const { error: updateError } = await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (updateError) {
          console.error('Error updating payment transaction:', updateError);
        }
      }

      // Update session status to processing payment
      const { error: sessionError } = await supabaseClient
        .from('sessions')
        .update({
          payment_status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error updating session status:', sessionError);
      }

      // Return the client secret to the client
      return new Response(
        JSON.stringify({
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Stripe API error. Please check your Stripe configuration and try again.',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
