
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateStepProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  availableDates: Date[];
}

export function DateStep({ selectedDate, onDateChange, availableDates }: DateStepProps) {
  const today = new Date();
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Date</h2>
          
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              disabled={(date) => {
                // Disable dates before today
                const isBeforeToday = date < new Date(today.setHours(0, 0, 0, 0));
                
                // Disable dates with no availability
                const hasAvailability = availableDates.some(availableDate => 
                  isSameDay(date, availableDate)
                );
                
                return isBeforeToday || !hasAvailability;
              }}
              classNames={{
                day_today: "bg-muted",
                day_selected: "bg-usc-cardinal text-white hover:bg-usc-cardinal-dark focus:bg-usc-cardinal-dark",
                day_disabled: "text-muted-foreground opacity-50",
                button_prev: cn("absolute left-1"),
                button_next: cn("absolute right-1"),
                nav: cn("flex items-center justify-between"),
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                cell: cn("text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"),
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
            />
          </div>
          
          {!availableDates.length && (
            <p className="text-center text-sm text-muted-foreground">
              No available dates found. Please check back later.
            </p>
          )}
          
          {selectedDate && (
            <div className="text-center text-sm">
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
