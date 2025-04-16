
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { formatTimeDisplay } from "../time-utils";
import { Clock, CalendarDays, DollarSign, FileText } from "lucide-react";

export interface BookingSummaryProps {
  selectedDate: Date;
  selectedTime: string;
  durationMinutes: number;
  cost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function BookingSummary({
  selectedDate,
  selectedTime,
  durationMinutes,
  cost,
  notes,
  onNotesChange
}: BookingSummaryProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Booking Summary</h3>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Date</p>
            <p className="text-muted-foreground">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Time</p>
            <p className="text-muted-foreground">
              {formatTimeDisplay(selectedTime)} - {formatTimeDisplay(addMinutesToTime(selectedTime, durationMinutes))}
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">Cost</p>
            <p className="text-muted-foreground">${cost}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <p className="font-medium">Session Notes (optional)</p>
        </div>
        <Textarea
          placeholder="Add any specific topics or questions you'd like to cover in the session..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}

// Helper function for calculating end time
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}
