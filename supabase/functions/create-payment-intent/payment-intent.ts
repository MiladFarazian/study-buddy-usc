
// Payment intent creation logic
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import Stripe from 'https://esm.sh/stripe@12.13.0?target=deno';

// Check for existing transactions
async function checkExistingTransaction(supabaseAdmin: SupabaseClient, sessionId: string, stripeSecretKey: string) {
  const { data: existingTransaction, error: txCheckError } = await supabaseAdmin
    .from('payment_transactions')
    .select('id, stripe_payment_intent_id, status')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .or('status.eq.processing')
    .maybeSingle();
  
  if (txCheckError) {
    console.error('Error checking for existing transactions:', txCheckError);
  }
  
  // If there's an existing transaction with a valid payment intent, return it
  if (existingTransaction?.stripe_payment_intent_id) {
    console.log(`Found existing payment intent: ${existingTransaction.stripe_payment_intent_id}`);
    
    try {
      // Initialize Stripe
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      
      // Retrieve the existing payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(
        existingTransaction.stripe_payment_intent_id
      );
      
      // Only return if it's in a usable state
      if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(paymentIntent.status)) {
        return {
          existingIntent: true,
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          payment_transaction_id: existingTransaction.id,
          paymentIntent
        };
      }
    } catch (retrieveError) {
      console.error('Error retrieving existing payment intent:', retrieveError);
    }
  }
  
  return { existingIntent: false };
}

// Get tutor's Stripe account details
async function getTutorStripeAccount(supabaseAdmin: SupabaseClient, tutorId: string, isProduction: boolean) {
  const connectIdField = isProduction ? 'stripe_connect_live_id' : 'stripe_connect_id';
  const onboardingCompleteField = isProduction ? 'stripe_connect_live_onboarding_complete' : 'stripe_connect_onboarding_complete';
  
  const { data: tutorProfile, error: tutorError } = await supabaseAdmin
    .from('profiles')
    .select(`${connectIdField}, ${onboardingCompleteField}, first_name, last_name`)
    .eq('id', tutorId)
    .single();

  if (tutorError || !tutorProfile) {
    console.error('Error fetching tutor profile:', tutorError);
    throw new Error('Tutor profile not found');
  }

  const tutorName = tutorProfile.first_name && tutorProfile.last_name 
    ? `${tutorProfile.first_name} ${tutorProfile.last_name}`
    : 'Tutor';
    
  console.log(`Processing for tutor: ${tutorName}, Connect ID: ${tutorProfile[connectIdField] || 'not set up'}`);

  const hasCompleteConnectAccount = tutorProfile[connectIdField] && tutorProfile[onboardingCompleteField];
  
  return {
    tutorName,
    hasCompleteConnectAccount,
    connectId: tutorProfile[connectIdField]
  };
}

// Create payment transaction record in the database
async function createPaymentTransaction(
  supabaseAdmin: SupabaseClient,
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number,
  paymentIntentId: string,
  paymentIntentStatus: string,
  isTwoStagePayment: boolean,
  platformFeeAmount: number,
  isProduction: boolean
) {
  const { data: paymentTransaction, error: paymentError } = await supabaseAdmin
    .from('payment_transactions')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      tutor_id: tutorId,
      amount: parseFloat(amount.toString()),
      status: 'pending',
      stripe_payment_intent_id: paymentIntentId,
      payment_intent_status: paymentIntentStatus,
      platform_fee: platformFeeAmount / 100,
      requires_transfer: isTwoStagePayment,
      payment_type: isTwoStagePayment ? 'two_stage' : 'connect_direct',
      environment: isProduction ? 'production' : 'test'
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment transaction:', paymentError);
    throw new Error('Failed to create payment transaction record');
  }
  
  console.log(`Created payment transaction: ${paymentTransaction.id}`);
  return paymentTransaction;
}

// Create pending transfer record
async function createPendingTransfer(
  supabaseAdmin: SupabaseClient,
  paymentTransactionId: string,
  sessionId: string,
  tutorId: string,
  studentId: string,
  tutorAmount: number,
  platformFeeAmount: number,
  paymentIntentId: string,
  transferGroup: string,
  isProduction: boolean
) {
  const { error: transferError } = await supabaseAdmin
    .from('pending_transfers')
    .insert({
      payment_transaction_id: paymentTransactionId,
      session_id: sessionId,
      tutor_id: tutorId,
      student_id: studentId,
      amount: tutorAmount / 100, // Convert back to dollars
      platform_fee: platformFeeAmount / 100,
      status: 'pending',
      payment_intent_id: paymentIntentId,
      transfer_group: transferGroup,
      environment: isProduction ? 'production' : 'test'
    });
    
  if (transferError) {
    console.error('Error creating pending transfer record:', transferError);
  } else {
    console.log(`Created pending transfer record for tutor: ${tutorId}`);
  }
}

// Main function to create payment intent
export async function createPaymentIntent(
  supabaseAdmin: SupabaseClient,
  stripeSecretKey: string,
  sessionId: string,
  amount: number,
  tutorId: string,
  studentId: string,
  description: string = '',
  forceTwoStage: boolean = false,
  isProduction: boolean = false
) {
  console.log(`Creating payment intent for session ${sessionId} with amount ${amount} (${isProduction ? 'production' : 'test'} mode)`);
  console.log(`forceTwoStage: ${forceTwoStage}`);

  // Check for existing transaction
  const existingResult = await checkExistingTransaction(supabaseAdmin, sessionId, stripeSecretKey);
  if (existingResult.existingIntent) {
    return {
      id: existingResult.id,
      client_secret: existingResult.client_secret,
      amount: amount,
      payment_transaction_id: existingResult.payment_transaction_id,
      environment: isProduction ? 'production' : 'test'
    };
  }

  // Get tutor's Stripe Connect account
  const { tutorName, hasCompleteConnectAccount, connectId } = 
    await getTutorStripeAccount(supabaseAdmin, tutorId, isProduction);

  // Initialize Stripe with error handling and retry logic
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 2, // Add automatic retries for network issues
  });

  // Guard against double cents conversion
  const raw = Number(amount);
  const amountCents = raw >= 1000 ? raw : Math.round(raw * 100);
  console.log('amount_in_request', raw, 'amount_cents_to_stripe', amountCents);
  
  if (isNaN(amountCents) || amountCents <= 0) {
    throw new Error('Invalid amount value');
  }
  
  console.log('Creating new payment intent with amount in cents:', amountCents);
  
  // Calculate platform fee (10% of the amount)
  const platformFeeAmount = Math.round(amountCents * 0.1);
  
  // Get transfer group ID based on session for tracking
  const transferGroup = `session_${sessionId}`;
  
  // Create a payment intent based on whether the tutor has a Connect account set up
  // Also check if forceTwoStage is true, which takes precedence
  let paymentIntent;
  let isTwoStagePayment = false;
  
  if (hasCompleteConnectAccount && !forceTwoStage) {
    console.log("Creating standard Connect payment with direct transfer");
    // Create a standard Connect payment intent with immediate transfer
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'automatic',
      metadata: {
        sessionId,
        tutorId,
        studentId,
        platformFee: platformFeeAmount,
        tutorName,
        paymentType: 'connect_direct',
        environment: isProduction ? 'production' : 'test'
      },
      description: description || `Tutoring session payment for ${tutorName}`,
      application_fee_amount: platformFeeAmount, // Platform fee (10%)
      transfer_data: {
        destination: connectId, // Tutor's Connect account
      },
      transfer_group: transferGroup, // Used to track related transfers
      on_behalf_of: connectId, // Show in the connected account's dashboard too
    });
    
    console.log(`Created Connect payment intent: ${paymentIntent.id} with transfer to: ${connectId}`);
  } else {
    console.log("Creating two-stage payment (platform first, transfer later)");
    // Create a regular payment intent to the platform account
    // Either because of forceTwoStage=true or because the tutor doesn't have Connect set up
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'automatic',
      metadata: {
        sessionId,
        tutorId,
        studentId,
        platformFee: platformFeeAmount,
        tutorName,
        paymentType: 'two_stage',
        requiresTransfer: 'true',
        environment: isProduction ? 'production' : 'test'
      },
      description: description || `Tutoring session payment for ${tutorName} (pending tutor onboarding)`,
      transfer_group: transferGroup, // Used to track related transfers
    });
    
    isTwoStagePayment = true;
    console.log(`Created two-stage payment intent: ${paymentIntent.id} for tutor: ${tutorId}`);
  }

  // Create a payment transaction record in the database
  const paymentTransaction = await createPaymentTransaction(
    supabaseAdmin,
    sessionId,
    studentId,
    tutorId,
    amount,
    paymentIntent.id,
    paymentIntent.status,
    isTwoStagePayment,
    platformFeeAmount,
    isProduction
  );

  // If this is a two-stage payment, create a pending_transfers record
  if (isTwoStagePayment) {
    // Calculate tutor amount (total minus platform fee)
    const tutorAmount = amountCents - platformFeeAmount;
    
    await createPendingTransfer(
      supabaseAdmin,
      paymentTransaction.id,
      sessionId,
      tutorId,
      studentId,
      tutorAmount,
      platformFeeAmount,
      paymentIntent.id,
      transferGroup,
      isProduction
    );
  }
  
  // Return the payment intent information
  return {
    id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    amount: amount, // Keep original amount for display
    payment_transaction_id: paymentTransaction?.id,
    two_stage_payment: isTwoStagePayment,
    environment: isProduction ? 'production' : 'test'
  };
}
