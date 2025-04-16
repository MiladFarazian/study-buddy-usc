
import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, DollarSign, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeDisplay } from '../time-utils';

interface BookingSummaryProps {
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
  // Calculate end time
  const startDate = new Date(selectedDate);
  const [hours, minutes] = selectedTime.split(':').map(Number);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  
  const endTime = format(endDate, 'HH:mm');
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Confirm Your Booking</h2>
      
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <h3 className="text-lg font-medium mb-3">Booking Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-3 text-muted-foreground" />
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
            <span>{formatTimeDisplay(selectedTime)} - {formatTimeDisplay(endTime)}</span>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
            <span>${cost.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Notes for your tutor (optional)
        </label>
        <Textarea
          placeholder="Anything specific you'd like to cover in this session?"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

export default BookingSummary;
