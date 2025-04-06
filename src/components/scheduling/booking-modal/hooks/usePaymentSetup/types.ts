
import { Tutor } from '@/types/tutor';
import { User } from '@supabase/supabase-js';

export interface PaymentSetupState {
  clientSecret: string | null;
  paymentAmount: number;
  paymentError: string | null;
  isTwoStagePayment: boolean;
  retryCount: number;
  isProcessing: boolean;
}

export interface PaymentSetupResult {
  success: boolean;
  alreadyInProgress?: boolean;
  isTwoStagePayment?: boolean;
}

export interface SetupPaymentParams {
  sessionId: string;
  amount: number;
  tutor: Tutor;
  user: User | null;
  forceTwoStage?: boolean;
}
