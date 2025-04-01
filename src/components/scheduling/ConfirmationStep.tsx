
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import {
  CalendarIcon,
  Clock,
  User,
  CreditCard,
  Check,
  BookOpen
} from "lucide-react";
import { useScheduling } from "@/contexts/SchedulingContext";

interface ConfirmationStepProps {
  onClose: () => void;
  onReset: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onClose, onReset }) => {
  const { state, tutor, calculatePrice } = useScheduling();
  const { selectedDate, selectedTimeSlot, sessionDuration, notes } = state;
  
  // Calculate total cost
  const totalCost = sessionDuration ? calculatePrice(sessionDuration) : 0;
  
  // Format selected date and time for display
  const formattedDate = selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '';
  const formattedStartTime = selectedTimeSlot?.start || '';
  
  // Calculate end time based on duration
  const calculateEndTime = () => {
    if (!selectedTimeSlot?.start || !sessionDuration) return '';
    
    const [hours, minutes] = selectedTimeSlot.start.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + sessionDuration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  const formattedEndTime = calculateEndTime();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          Your tutoring session has been successfully booked.
        </p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Session Details</h3>
            
            <div className="bg-muted/30 p-4 rounded-md space-y-3">
              {tutor && (
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">{tutor.name}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{formattedStartTime} - {formattedEndTime}</span>
              </div>
              
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{sessionDuration} minutes session</span>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>${totalCost.toFixed(2)}</span>
              </div>
              
              {notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={() => {
            onReset();
            onClose();
          }}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Done
        </Button>
        <Button 
          variant="outline" 
          onClick={onReset}
        >
          Book Another Session
        </Button>
      </div>
    </div>
  );
};
