
import React from 'react';
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  message?: string;
  onViewSchedule?: () => void;
}

export const SuccessScreen = ({ 
  message = "Your booking has been confirmed!",
  onViewSchedule
}: SuccessScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-green-100 p-3 mb-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-medium mb-2">Booking Confirmed</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      
      {onViewSchedule && (
        <Button onClick={onViewSchedule}>
          View My Schedule
        </Button>
      )}
    </div>
  );
};
