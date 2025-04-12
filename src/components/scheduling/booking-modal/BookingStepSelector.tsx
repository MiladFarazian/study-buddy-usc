
import { useState, useEffect } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimeSlotList } from "./time-slot/TimeSlotList";
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "./LoadingState";
import { DateSelector } from "./date-selector/DateSelector";

export interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function BookingStepSelector({ tutor, onSelectSlot, onClose, disabled }: BookingStepSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, selectedDate);
  
  // Filter slots for the selected date
  const slotsForSelectedDate = availableSlots.filter(slot => 
    new Date(slot.day).toDateString() === selectedDate.toDateString() && slot.available
  );

  if (loading) {
    return <LoadingState message="Loading tutor's availability..." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardContent className="pt-6">
              <DateSelector
                date={selectedDate}
                onDateChange={setSelectedDate}
                availableSlots={availableSlots}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-6">
          <h3 className="text-lg font-medium mb-3">
            Available Times for {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {slotsForSelectedDate.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <TimeSlotList 
                slots={slotsForSelectedDate}
                onSelectSlot={onSelectSlot}
                disabled={disabled}
              />
            </ScrollArea>
          ) : (
            <div className="py-8 text-center border rounded-md bg-muted/30">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">No Available Time Slots</h3>
              <p className="text-muted-foreground mb-4">
                {hasAvailability ? 
                  `${tutor.firstName || tutor.name.split(' ')[0]} is not available on this date.` : 
                  `${tutor.firstName || tutor.name.split(' ')[0]} hasn't set their availability yet.`
                }
              </p>
              <Button onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                Check Next Day
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
