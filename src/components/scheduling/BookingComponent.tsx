
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { Loader2 } from "lucide-react";

interface BookingComponentProps {
  tutor: Tutor;
  availableSlots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  onCancel: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function BookingComponent({ 
  tutor, 
  availableSlots, 
  onSelectSlot, 
  onCancel,
  loading,
  disabled = false
}: BookingComponentProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Get unique dates that have available slots
  const availableDates = [...new Set(
    availableSlots
      .filter(slot => slot.available)
      .map(slot => format(new Date(slot.day), 'yyyy-MM-dd'))
  )];
  
  // Get available time slots for the selected date
  const availableTimesForDate = selectedDate 
    ? availableSlots.filter(slot => 
        format(new Date(slot.day), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && 
        slot.available
      )
    : [];

  // Handle form submission
  const handleSubmit = () => {
    if (selectedDate && selectedTime) {
      const selectedSlot = availableTimesForDate.find(slot => slot.start === selectedTime);
      if (selectedSlot) {
        onSelectSlot(selectedSlot);
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
            <span className="ml-2">Loading availability...</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="date">Select a Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                disabled={(date) => !availableDates.includes(format(date, 'yyyy-MM-dd'))}
                className="rounded-md border mx-auto"
              />
            </div>
            
            {selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="time">Select a Time</Label>
                <Select 
                  value={selectedTime || ""} 
                  onValueChange={setSelectedTime}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimesForDate.length > 0 ? (
                      availableTimesForDate.map((slot) => (
                        <SelectItem key={`${slot.start}-${slot.end}`} value={slot.start}>
                          {slot.start} - {slot.end}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No times available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedDate || !selectedTime || disabled}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
