
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuth } from "@/contexts/AuthContext";

export const BookingForm: React.FC = () => {
  const { user, profile } = useAuth();
  const { state, dispatch, tutor, calculatePrice } = useScheduling();
  const { selectedDate, selectedTimeSlot, sessionDuration, notes } = state;
  
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
  
  // Format time to 12-hour format
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_NOTES', payload: e.target.value });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Session Details</h2>
      
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="font-medium">Date & Time:</p>
            <p className="text-muted-foreground">
              {formattedDate} at {formatTime(formattedStartTime)} - {formatTime(formattedEndTime)}
            </p>
          </div>
          
          <div>
            <p className="font-medium">Duration:</p>
            <p className="text-muted-foreground">{sessionDuration} minutes</p>
          </div>
          
          <div>
            <p className="font-medium">Tutor:</p>
            <p className="text-muted-foreground">{tutor?.name}</p>
          </div>
          
          <div>
            <p className="font-medium">Cost:</p>
            <p className="text-muted-foreground">${totalCost.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes for the tutor (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any specific topics you want to focus on..."
            value={notes}
            onChange={handleNotesChange}
            className="min-h-24"
          />
        </div>
      </div>
    </div>
  );
};
