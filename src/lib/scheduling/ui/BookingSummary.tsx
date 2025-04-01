
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { formatDateForDisplay, getFormattedTime } from '../index';

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
  // Calculate end time
  const getEndTime = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Booking Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Date</div>
                <div className="font-medium">{formatDateForDisplay(selectedDate)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Time</div>
                <div className="font-medium">
                  {getFormattedTime(selectedTime)} - {getFormattedTime(getEndTime())}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Duration</div>
                <div className="font-medium">{durationMinutes} minutes</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Cost</div>
                <div className="font-medium">${cost.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or specific topics you want to cover in the session..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="h-24"
            />
          </div>
          
          <div className="rounded-md bg-muted p-4">
            <div className="text-sm font-medium">Payment Information</div>
            <p className="text-sm text-muted-foreground mt-1">
              You will be charged ${cost.toFixed(2)} for this session once confirmed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
