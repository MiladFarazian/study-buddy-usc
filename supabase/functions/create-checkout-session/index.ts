import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, amount, tutorName, studentName, sessionDate, sessionTime } = await req.json();

    // Initialize Stripe with secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tutoring Session with ${tutorName}`,
              description: `${sessionDate} at ${sessionTime}`,
            },
            unit_amount: Math.round(amount), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/payment-success?session_id=${sessionId}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled?session_id=${sessionId}`,
      metadata: {
        sessionId: sessionId,
        tutorName: tutorName,
        studentName: studentName,
      },
    });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        checkoutSessionId: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});