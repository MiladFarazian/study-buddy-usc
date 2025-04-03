
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const StudentPaymentView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <p className="text-sm text-muted-foreground">
          Manage your payment methods for tutoring sessions
        </p>
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            We collect payment information securely when you book a session with a tutor.
          </AlertDescription>
        </Alert>
        
        <div className="border p-6 rounded-md text-center">
          <p className="text-muted-foreground mb-4">
            Your payment information is securely handled through Stripe when you book a session.
          </p>
          <Button 
            variant="outline" 
            className="bg-white"
            disabled
          >
            Payment methods managed per-session
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-medium">Payment History</h3>
        <p className="text-sm text-muted-foreground">
          View your payment history for tutoring sessions
        </p>
        
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-muted-foreground">
            Your payment history will be displayed here once you book sessions
          </p>
        </div>
      </div>
    </div>
  );
};
