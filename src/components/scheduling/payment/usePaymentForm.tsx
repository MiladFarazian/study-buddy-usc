
// This file is now deprecated. Import from hooks/usePaymentForm.ts instead
import { usePaymentForm as usePaymentFormHook } from "./hooks/usePaymentForm";

export function usePaymentForm(props: {
  tutor: any;
  selectedSlot: any;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  onPaymentComplete: () => void;
}) {
  const result = usePaymentFormHook(props);
  
  // Adapt the new hook structure to match the old interface
  // for backward compatibility
  return {
    ...result,
    handleSubmitPayment: result.submitPayment
  };
}
