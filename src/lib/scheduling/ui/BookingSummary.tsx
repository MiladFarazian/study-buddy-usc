
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTimeDisplay } from "../time-utils";

export interface BookingSummaryProps {
  cost: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  selectedDate?: Date; // Add for compatibility
  selectedTime?: string; // Add for compatibility
  durationMinutes?: number; // Add for compatibility
}

export function BookingSummary({
  cost,
  notes,
  onNotesChange,
  selectedDate,
  selectedTime,
  durationMinutes = 60,
}: BookingSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Booking Summary</h3>
        <div className="bg-gray-50 p-4 rounded-md space-y-2">
          {selectedDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(selectedDate)}</span>
            </div>
          )}
          
          {selectedTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{formatTimeDisplay(selectedTime)}</span>
            </div>
          )}
          
          {durationMinutes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{durationMinutes} minutes</span>
            </div>
          )}
          
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>${cost.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium">
          Additional Notes (Optional)
        </label>
        <Textarea
          id="notes"
          placeholder="Add any specific topics or questions you'd like to cover..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
