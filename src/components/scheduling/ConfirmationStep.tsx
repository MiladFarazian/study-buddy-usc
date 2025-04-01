
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Calendar, Clock, User, CreditCard } from "lucide-react";
import { format } from 'date-fns';
import { useScheduling } from '@/contexts/SchedulingContext';

interface ConfirmationStepProps {
  onClose: () => void;
  onReset: () => void;
}

export function ConfirmationStep({ onClose, onReset }: ConfirmationStepProps) {
  const { state, tutor, calculatePrice } = useScheduling();
  const { selectedDate, selectedTimeSlot, selectedDuration } = state;
  
  // Calculate session cost
  const sessionCost = selectedDuration ? calculatePrice(selectedDuration) : 0;
  
  // Format date and time for display
  const formattedDate = selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '';
  const formattedStartTime = selectedTimeSlot?.start || '';
  
  // Calculate end time based on duration
  const calculateEndTime = () => {
    if (!selectedTimeSlot?.start || !selectedDuration) return '';
    
    const [hours, minutes] = selectedTimeSlot.start.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedDuration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  const formattedEndTime = calculateEndTime();
  
  // Format duration for display (e.g., "1 hour", "30 minutes", "1 hour 30 minutes")
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4 mx-auto">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-center">Booking Confirmed!</CardTitle>
        <CardDescription className="text-center">
          Your session has been successfully booked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-md space-y-3">
            {tutor && (
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <span className="font-medium">{tutor.name}</span>
                  {tutor.subjects && tutor.subjects.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {typeof tutor.subjects[0] === 'string' 
                        ? tutor.subjects[0] 
                        : 'object' in tutor.subjects[0] 
                          ? (tutor.subjects[0] as any).name || 'Subject' 
                          : 'Subject'}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <div>{formattedStartTime} - {formattedEndTime}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedDuration ? formatDuration(selectedDuration) : ''}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="font-medium">${sessionCost.toFixed(2)} paid</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              We've sent a confirmation email with all the details of your booking.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={onReset}
                className="sm:flex-1 max-w-[200px] mx-auto"
              >
                Book Another Session
              </Button>
              
              <Button 
                onClick={onClose}
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white sm:flex-1 max-w-[200px] mx-auto"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
