
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateSelector } from "@/lib/scheduling/ui/DateSelector";

interface DateStepProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  availableDates: Date[];
}

export function DateStep({ selectedDate, onDateChange, availableDates }: DateStepProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Date</h2>
          
          <DateSelector 
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            availableDates={availableDates}
          />
          
          {selectedDate && (
            <div className="text-center text-sm mt-4">
              <p className="font-medium">
                Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
