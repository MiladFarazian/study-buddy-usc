
import { supabase } from "@/integrations/supabase/client";
import { PaymentSetupParams, PaymentSetupResult } from "./types";
import { toast } from "sonner";

export async function setupPaymentHandler(params: PaymentSetupParams): Promise<PaymentSetupResult> {
  try {
    const { sessionId, amount, tutor, user, forceTwoStage = false } = params;
    
    // Basic client-side validation to prevent invalid requests
    if (!sessionId || amount <= 0 || !tutor.id || !user.id) {
      return { 
        success: false, 
        error: 'Missing required parameters for payment setup'
      };
    }
    
    // Format the request payload
    const requestPayload = { 
      sessionId, 
      amount: Math.round(amount * 100), // Convert to cents
      tutorId: tutor.id,
      studentId: user.id,
      tutorName: tutor.name || `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim(),
      studentEmail: user.email || '',
      forceTwoStage
    };
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Make the request to the create-payment-intent function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      }
    );
    
    if (!response.ok) {
      // Handle rate limiting separately
      if (response.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return { 
          success: false, 
          error: 'Rate limited. Please try again later.'
        };
      }
      
      // Handle other errors
      const errorText = await response.text();
      console.error("Payment setup error:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return { 
          success: false, 
          error: errorData.error || 'Error setting up payment',
          retryWithTwoStage: errorData.code === 'payment_requires_two_stage' || undefined
        };
      } catch (e) {
        // Handle text errors
        return { 
          success: false, 
          error: errorText || 'Error setting up payment' 
        };
      }
    }
    
    // Parse successful response
    const data = await response.json();
    
    if (!data.clientSecret) {
      return { 
        success: false, 
        error: 'No client secret returned'
      };
    }
    
    return { 
      success: true, 
      clientSecret: data.clientSecret,
      isTwoStagePayment: data.isTwoStagePayment || false,
      amount: amount // Return the amount for consistency
    };
    
  } catch (error) {
    console.error("Error during payment setup:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during payment setup'
    };
  }
}
