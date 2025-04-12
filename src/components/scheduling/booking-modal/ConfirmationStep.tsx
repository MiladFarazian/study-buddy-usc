
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Calendar, Clock, User, CreditCard } from "lucide-react";
import { format } from 'date-fns';
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";

interface ConfirmationStepProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  onClose: () => void;
  onReset?: () => void;
}

export function ConfirmationStep({ 
  tutor, 
  selectedSlot, 
  onClose,
  onReset
}: ConfirmationStepProps) {
  // Format date and time for display
  const slotDay = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
  const formattedDate = format(slotDay, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = selectedSlot.start;
  const formattedEndTime = selectedSlot.end;
  
  // Calculate session cost
  const hourlyRate = tutor.hourlyRate || 25; // Default to $25 if not set
  const [startHour, startMinute] = selectedSlot.start.split(':').map(Number);
  const [endHour, endMinute] = selectedSlot.end.split(':').map(Number);
  
  // Calculate duration in minutes
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const durationMinutes = endMinutes - startMinutes;
  const durationHours = durationMinutes / 60;
  
  // Calculate session cost
  const sessionCost = hourlyRate * durationHours;
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          Your session with {tutor.name} has been successfully booked.
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md space-y-3">
        <div className="flex items-center">
          <User className="h-5 w-5 mr-3 text-muted-foreground" />
          <div>
            <span className="font-medium">{tutor.name}</span>
            {tutor.subjects && tutor.subjects.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {tutor.subjects[0]?.name || tutor.subjects[0]?.code || 'Tutor'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
          <div>
            <div>{formattedStartTime} - {formattedEndTime}</div>
            <div className="text-sm text-muted-foreground">
              {durationMinutes} minutes
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
          <span className="font-medium">${sessionCost.toFixed(2)} paid</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
        {onReset && (
          <Button 
            variant="outline" 
            onClick={onReset}
            className="sm:flex-1 max-w-[200px] mx-auto"
          >
            Book Another Session
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white sm:flex-1 max-w-[200px] mx-auto"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
