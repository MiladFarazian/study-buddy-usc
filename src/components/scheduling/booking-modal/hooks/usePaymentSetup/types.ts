
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
  };
  user: {
    id: string;
    email?: string;
  };
  forceTwoStage?: boolean;
}
