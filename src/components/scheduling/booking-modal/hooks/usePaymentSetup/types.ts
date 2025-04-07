
// Update the PaymentSetupResult type to include the retryWithTwoStage property
export interface PaymentSetupResult {
  success: boolean;
  error?: string;
  alreadyInProgress?: boolean;
  clientSecret?: string;
  isTwoStagePayment?: boolean;
  retryWithTwoStage?: boolean; // Added this property to fix the TS error
}

export interface SetupPaymentParams {
  sessionId: string;
  amount: number;
  tutor: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string; // Added lastName to fix TS error
  };
  user: {
    id: string;
    email?: string;
  };
  forceTwoStage?: boolean;
}

// Add the PaymentSetupState interface that was missing
export interface PaymentSetupState {
  clientSecret: string | null;
  paymentAmount: number;
  paymentError: string | null;
  isTwoStagePayment: boolean;
  isProcessing: boolean;
  retryCount: number; // Added this property to fix the TS error
}
