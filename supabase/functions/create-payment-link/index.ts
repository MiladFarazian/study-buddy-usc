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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { sessionId, amount, tutorId, description, userId } = await req.json();
    
    if (!sessionId || !amount || !tutorId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating Payment Link for:', { sessionId, amount, tutorId, studentId: user.id });

    // Create Payment Link instead of Payment Intent
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description || `Tutoring Session ${sessionId.slice(0, 8)}`,
              description: `One-hour tutoring session`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_creation: 'always', // Force real customer creation (not guest)
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.headers.get('origin') || 'https://localhost:3000'}/payment-success?session_id=${sessionId}`,
        },
      },
      metadata: {
        sessionId,
        tutorId,
        studentId: user.id,
        userId: user.id,
        tutorName: description?.split(' with ')?.[1]?.split(' - ')?.[0] || 'Tutor',
        studentName: 'Student',
      },
    });

    // Create payment transaction record
    const { data: paymentTransaction, error: dbError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        tutor_id: tutorId,
        amount: Math.round(amount * 100), // Store cents in database
        status: 'pending',
        payment_link_id: paymentLink.id,
        payment_link_url: paymentLink.url,
        environment: 'test',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Payment Link created successfully:', {
      id: paymentLink.id,
      url: paymentLink.url,
      payment_transaction_id: paymentTransaction.id,
    });

    // Return Payment Link URL to redirect student
    return new Response(JSON.stringify({
      payment_link_url: paymentLink.url,
      payment_link_id: paymentLink.id,
      payment_transaction_id: paymentTransaction.id,
      amount: amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as any;
    console.error('Error creating payment link:', error);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});