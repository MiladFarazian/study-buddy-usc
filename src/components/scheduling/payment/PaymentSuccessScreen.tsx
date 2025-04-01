
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
      
      <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        Your tutoring session has been booked and payment has been processed successfully.
      </p>
      
      <div className="bg-muted/30 p-4 rounded-md w-full mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          You will receive an email confirmation shortly with the session details.
        </p>
        <p className="text-sm text-muted-foreground">
          You can view and manage your upcoming sessions in your schedule dashboard.
        </p>
      </div>
      
      <Button onClick={onComplete} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
        Done
      </Button>
    </div>
  );
}
