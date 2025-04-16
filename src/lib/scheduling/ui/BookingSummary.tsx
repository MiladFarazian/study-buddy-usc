
import React from 'react';
import { format } from 'date-fns';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface BookingSummaryProps {
  selectedDate: Date;
  selectedTime: string;
  durationMinutes: number;
  cost: number;
  notes?: string;
  onNotesChange?: (value: string) => void;
}

export function BookingSummary({
  selectedDate,
  selectedTime,
  durationMinutes,
  cost,
  notes,
  onNotesChange
}: BookingSummaryProps) {
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onNotesChange) {
      onNotesChange(e.target.value);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Booking Summary</h3>

      <div className="rounded-lg border p-4">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>{durationMinutes} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-bold">${cost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes || ''}
          onChange={handleNotesChange}
          placeholder="Add any specific requirements or information for your tutor..."
          rows={3}
        />
      </div>
    </div>
  );
}
