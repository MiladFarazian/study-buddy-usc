
import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScheduling } from "@/contexts/SchedulingContext";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";
import { format } from "date-fns";

interface ConfirmationStepProps {
  onClose: () => void;
  onReset: () => void;
}

export function ConfirmationStep({ onClose, onReset }: ConfirmationStepProps) {
  const { state, tutor, calculatePrice } = useScheduling();
  
  if (!state.selectedDate || !state.selectedTimeSlot || !tutor) {
    return null;
  }
  
  const sessionDate = format(state.selectedDate, 'MMMM d, yyyy');
  const sessionTime = formatTimeDisplay(state.selectedTimeSlot.start);
  const sessionPrice = calculatePrice(state.selectedDuration);
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-red-50 rounded-t-lg p-8 text-center">
        <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-usc-cardinal" />
        </div>
        
        <h2 className="text-2xl font-bold">Booking Confirmed</h2>
        <p className="text-gray-600 mt-2">
          Your tutoring session has been scheduled
        </p>
      </div>
      
      <div className="bg-white rounded-b-lg p-8">
        <div className="border-b py-5">
          <h3 className="text-gray-500">Date & Time</h3>
          <p className="text-xl font-bold mt-1">{sessionDate} at {sessionTime}</p>
        </div>
        
        <div className="border-b py-5">
          <h3 className="text-gray-500">Session Duration</h3>
          <p className="text-xl font-bold mt-1">{state.selectedDuration} minutes</p>
        </div>
        
        <div className="border-b py-5">
          <h3 className="text-gray-500">Tutor</h3>
          <div className="flex items-center mt-2">
            {tutor.imageUrl ? (
              <img 
                src={tutor.imageUrl} 
                alt={tutor.name} 
                className="h-12 w-12 rounded-full mr-3"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 mr-3" />
            )}
            <div>
              <p className="text-xl font-bold">{tutor.name}</p>
              <p className="text-gray-500">{tutor.subjects && tutor.subjects.length > 0 
                ? tutor.subjects[0].name || tutor.subjects[0].code 
                : "Computer Science"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="py-5">
          <h3 className="text-gray-500">Total Price</h3>
          <p className="text-xl font-bold mt-1">${sessionPrice.toFixed(0)}</p>
        </div>
        
        <Button 
          onClick={onClose}
          className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark text-white mt-4"
        >
          View My Schedule
        </Button>
      </div>
    </div>
  );
}
