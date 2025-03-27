
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentSuccessScreenProps {
  onComplete: () => void;
}

export const PaymentSuccessScreen = ({ onComplete }: PaymentSuccessScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-green-100 p-3">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      
      <h2 className="mt-6 text-2xl font-bold">Payment Successful!</h2>
      
      <p className="mt-3 text-muted-foreground max-w-md">
        Your tutoring session has been booked and confirmed. You can view your upcoming sessions in your schedule.
      </p>
      
      <Button 
        onClick={onComplete}
        className="mt-8 bg-usc-cardinal hover:bg-usc-cardinal-dark"
      >
        View My Schedule
      </Button>
    </div>
  );
};
