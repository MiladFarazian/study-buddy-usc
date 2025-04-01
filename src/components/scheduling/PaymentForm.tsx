
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling-utils";
import { SessionDetailsDisplay } from "./payment/SessionDetailsDisplay";
import { PaymentCardElement } from "./payment/PaymentCardElement";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { usePaymentForm } from "./payment/usePaymentForm";

interface PaymentFormProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({
  tutor,
  selectedSlot,
  sessionId,
  studentId,
  studentName,
  studentEmail,
  onPaymentComplete,
  onCancel
}: PaymentFormProps) => {
  const {
    loading,
    processing,
    paymentComplete,
    stripeLoaded,
    clientSecret,
    cardError,
    sessionCost,
    handleCardElementReady,
    handleSubmitPayment
  } = usePaymentForm({
    tutor,
    selectedSlot,
    sessionId,
    studentId,
    studentName,
    studentEmail,
    onPaymentComplete
  });
  
  if (paymentComplete) {
    return <PaymentSuccessScreen onComplete={onPaymentComplete} />;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
        <CardDescription>
          Enter your payment details to confirm your session with {tutor.name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SessionDetailsDisplay 
          tutor={tutor} 
          selectedSlot={selectedSlot} 
        />
        
        <PaymentCardElement
          onCardElementReady={handleCardElementReady}
          onSubmit={handleSubmitPayment}
          onCancel={onCancel}
          processing={processing}
          loading={loading}
          cardError={cardError}
          amount={sessionCost}
          stripeLoaded={stripeLoaded}
          clientSecret={clientSecret}
        />
      </CardContent>
    </Card>
  );
};
