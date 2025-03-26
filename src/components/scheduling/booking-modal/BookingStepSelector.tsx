
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCalendar } from "../BookingCalendar";
import { BookingCalendarDrag } from "../BookingCalendarDrag";
import { BookingSlot, WeeklyAvailability } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAvailabilityData } from "../calendar/useAvailabilityData";
import { Slider } from "@/components/ui/slider";

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
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 60]); // Minutes from start time
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [slotEnd, setSlotEnd] = useState<Date | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  
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
    
    // Parse the slot's start and end times
    const slot = formattedSlot.originalSlot;
    const slotStartDate = new Date(slot.day);
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    slotStartDate.setHours(startHour, startMinute, 0, 0);
    const slotEndDate = new Date(slot.day);
    slotEndDate.setHours(endHour, endMinute, 0, 0);
    
    setSlotStart(slotStartDate);
    setSlotEnd(slotEndDate);
    
    // Reset time range when selecting a new slot
    const totalMinutes = differenceInMinutes(slotEndDate, slotStartDate);
    setTimeRange([0, Math.min(60, totalMinutes)]); // Default to 1 hour or max available time
    
    // Calculate initial cost
    calculateCost(0, Math.min(60, totalMinutes), slotStartDate, slotEndDate);
  };
  
  // Calculate the cost based on the selected time range
  const calculateCost = (startMinutes: number, endMinutes: number, start: Date | null, end: Date | null) => {
    if (!start || !end || !tutor.hourlyRate) return;
    
    const selectedDuration = (endMinutes - startMinutes) / 60; // Convert to hours
    const estimatedCost = tutor.hourlyRate * selectedDuration;
    setCalculatedCost(estimatedCost);
  };
  
  // Handle time range selection
  const handleTimeRangeChange = (value: number[]) => {
    if (value.length !== 2 || !slotStart || !slotEnd) return;
    setTimeRange([value[0], value[1]]);
    calculateCost(value[0], value[1], slotStart, slotEnd);
  };
  
  // Function to get the actual booking slot with the selected time range
  const getAdjustedBookingSlot = (): BookingSlot | null => {
    if (!selectedTime || !slotStart || !slotEnd) return null;
    
    // Create a slot with the adjusted time range
    const originalSlot = formattedTimeSlots.find(slot => 
      `${slot.start} - ${slot.end}` === selectedTime
    )?.originalSlot;
    
    if (!originalSlot) return null;
    
    // Create new start and end times based on the slider
    const adjustedStart = new Date(slotStart);
    adjustedStart.setMinutes(adjustedStart.getMinutes() + timeRange[0]);
    
    const adjustedEnd = new Date(slotStart);
    adjustedEnd.setMinutes(adjustedEnd.getMinutes() + timeRange[1]);
    
    // Format times back to HH:MM format
    const formattedStart = `${adjustedStart.getHours().toString().padStart(2, '0')}:${adjustedStart.getMinutes().toString().padStart(2, '0')}`;
    const formattedEnd = `${adjustedEnd.getHours().toString().padStart(2, '0')}:${adjustedEnd.getMinutes().toString().padStart(2, '0')}`;
    
    return {
      ...originalSlot,
      start: formattedStart,
      end: formattedEnd
    };
  };
  
  // Handle final slot selection
  const handleConfirmSlot = () => {
    const adjustedSlot = getAdjustedBookingSlot();
    if (adjustedSlot) {
      onSelectSlot(adjustedSlot);
    }
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
  
  // Format time for display
  const formatTimeDisplay = (minutes: number, baseDate: Date | null) => {
    if (!baseDate) return "";
    const time = new Date(baseDate);
    time.setMinutes(time.getMinutes() + minutes);
    return format(time, 'h:mm a');
  };
  
  // Calculate max slider value based on slot duration
  const getMaxSliderValue = () => {
    if (!slotStart || !slotEnd) return 60;
    return Math.min(180, differenceInMinutes(slotEnd, slotStart)); // Cap at 3 hours or max available
  };
  
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
        <Label>Select Time Slot</Label>
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
      
      {selectedTime && slotStart && (
        <div className="space-y-3 p-4 border rounded-md">
          <div className="flex justify-between items-center">
            <Label>Adjust Session Duration</Label>
            {calculatedCost !== null && (
              <span className="font-semibold text-usc-cardinal">${calculatedCost.toFixed(2)}</span>
            )}
          </div>
          
          <div className="py-4">
            <Slider
              defaultValue={timeRange}
              min={0}
              max={getMaxSliderValue()}
              step={15}
              value={timeRange}
              onValueChange={handleTimeRangeChange}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{formatTimeDisplay(timeRange[0], slotStart)}</span>
              <span>{formatTimeDisplay(timeRange[1], slotStart)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>Duration: {((timeRange[1] - timeRange[0]) / 60).toFixed(1)} hours</span>
            <span>Rate: ${tutor.hourlyRate}/hour</span>
          </div>
          
          <Button 
            className="w-full mt-2 bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
            onClick={handleConfirmSlot}
          >
            Confirm Selection
          </Button>
        </div>
      )}
      
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
