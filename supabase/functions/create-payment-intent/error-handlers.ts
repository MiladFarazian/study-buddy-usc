
// Error handling for Stripe and other errors
import { corsHeaders } from './cors-headers.ts';

export const errorHandlers = {
  handleStripeError: (stripeError: any, corsHeaders: Record<string, string>) => {
    console.error('Stripe API error:', stripeError);
    
    // Handle rate limiting errors specifically
    if (stripeError.type === 'StripeRateLimitError' || stripeError.code === 'rate_limit') {
      return new Response(
        JSON.stringify({
          error: 'Stripe API rate limit exceeded. Please try again in a moment.',
          code: 'rate_limited',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '5' },
          status: 429,
        }
      );
    }
    
    // Handle Connect-specific errors
    if (stripeError.code === 'account_invalid' || stripeError.code === 'account_incomplete') {
      console.log("Detected Stripe Connect account issue, recommending two-stage payment");
      return new Response(
        JSON.stringify({
          error: "Tutor's payment account is not fully set up",
          code: 'connect_incomplete',
          details: stripeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Handle other Stripe-specific errors
    if (stripeError.type === 'StripeCardError') {
      return new Response(
        JSON.stringify({
          error: stripeError.message,
          code: stripeError.code,
          decline_code: stripeError.decline_code
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Generic error handling
    return new Response(
      JSON.stringify({
        error: stripeError.message || 'An error occurred while processing the payment',
        code: stripeError.code || 'unknown_error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};
