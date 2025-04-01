
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface PaymentSuccessScreenProps {
  onComplete: () => void;
}

export function PaymentSuccessScreen({ onComplete }: PaymentSuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Session Request Submitted!</h3>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        Your tutoring session request has been submitted successfully. The payment functionality is currently being set up.
      </p>
      
      <div className="bg-muted/30 p-4 rounded-md w-full mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          While we finalize our payment system, please note that your tutor will be notified of your booking request.
        </p>
        <p className="text-sm text-muted-foreground">
          You will be contacted to arrange payment once the tutor confirms your session.
        </p>
      </div>
      
      <Button onClick={onComplete} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
        Done
      </Button>
    </div>
  );
}
