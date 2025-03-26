
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendar } from "../BookingCalendar";
import { BookingCalendarDrag } from "../BookingCalendarDrag";
import { BookingSlot, WeeklyAvailability } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityData } from "../calendar/useAvailabilityData";

interface BookingStepSelectorProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose: () => void;
}

export const BookingStepSelector = ({ 
  tutor, 
  onSelectSlot, 
  onClose 
}: BookingStepSelectorProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  
  const startDate = date || new Date();
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, startDate);
  
  // Filter available slots for the selected date
  const availableTimesForDate = availableSlots.filter(slot => {
    if (!date) return false;
    return (
      format(slot.day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
      slot.available
    );
  });
  
  // Format slots for display
  const formattedTimeSlots = availableTimesForDate.map(slot => ({
    start: formatTime(slot.start),
    end: formatTime(slot.end),
    originalSlot: slot
  }));
  
  // Helper function to format 24h time to 12h format
  function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  // Function to handle time slot selection
  const handleTimeSelect = (formattedSlot: { start: string, end: string, originalSlot: BookingSlot }) => {
    setSelectedTime(`${formattedSlot.start} - ${formattedSlot.end}`);
    onSelectSlot(formattedSlot.originalSlot);
  };
  
  // Show different UI based on loading and availability states
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
        <span className="ml-2">Loading availability...</span>
      </div>
    );
  }
  
  if (!hasAvailability || availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          {errorMessage || "No availability found for this tutor."}
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2">
        <Label>Select Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "EEEE, MMMM do, yyyy") : <span>Select a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3 pointer-events-auto"
              disabled={(date) => {
                // Disable dates that don't have available slots
                return !availableSlots.some(slot => 
                  format(slot.day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && slot.available
                );
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Select Time</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedTime && "text-muted-foreground"
              )}
            >
              <Clock className="mr-2 h-4 w-4" />
              {selectedTime ? selectedTime : <span>Select a time slot</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <ScrollArea className="h-[200px] p-4">
              {formattedTimeSlots.length > 0 ? (
                <div className="space-y-2">
                  {formattedTimeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left",
                        selectedTime === `${slot.start} - ${slot.end}` && "border-usc-cardinal bg-red-50"
                      )}
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {slot.start} - {slot.end}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No available time slots for selected date.
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Your Email</Label>
        <Input 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">A confirmation will be sent to this email address</p>
      </div>
    </div>
  );
};
