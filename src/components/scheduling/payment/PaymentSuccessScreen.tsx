
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface PaymentSuccessScreenProps {
  onComplete: () => void;
}

export const PaymentSuccessScreen = ({ onComplete }: PaymentSuccessScreenProps) => {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-10">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-center mb-2">Payment Successful!</CardTitle>
          <CardDescription className="text-center mb-6">
            Your session has been booked. You'll receive a confirmation email shortly.
          </CardDescription>
          <Button onClick={onComplete} className="mt-4">
            View Your Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
