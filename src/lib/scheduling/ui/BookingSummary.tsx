
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { CalendarIcon, Clock, DollarSign, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BookingSummaryProps {
  selectedDate: Date;
  selectedTime: string;
  durationMinutes: number;
  cost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDate,
  selectedTime,
  durationMinutes,
  cost,
  notes,
  onNotesChange
}) => {
  // Format date and time
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  
  // Convert time to 12-hour format
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Calculate end time
  const calculateEndTime = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Booking Summary</h2>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Time</p>
              <p className="text-muted-foreground">
                {formatTime(selectedTime)} - {formatTime(calculateEndTime())} ({durationMinutes} minutes)
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Price</p>
              <p className="text-muted-foreground">${cost.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
          <Label htmlFor="notes" className="font-medium">
            Notes for the tutor (optional)
          </Label>
        </div>
        <Textarea
          id="notes"
          placeholder="Any specific topics you want to focus on..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-24"
        />
      </div>
    </div>
  );
};
