
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingSlot, WeeklyAvailability } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { format, parseISO, differenceInMinutes, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [email, setEmail] = useState<string>("");
  const [sessionDuration, setSessionDuration] = useState<number>(60); // Default 60 minutes
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  
  const startDate = date || new Date();
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, startDate);
  
  // Filter available slots for the selected date
  const availableTimeSlotsForDate = availableSlots.filter(slot => {
    if (!date) return false;
    return (
      format(slot.day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
      slot.available
    );
  });
  
  // Helper function to convert 24h time to 12h format for display
  function formatTimeForDisplay(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  // Function to handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    
    // Set initial duration to 60 minutes or the max available time if less
    const startTimeMinutes = convertTimeToMinutes(slot.start);
    const endTimeMinutes = convertTimeToMinutes(slot.end);
    const maxDuration = endTimeMinutes - startTimeMinutes;
    
    // Set default duration (1 hour or max available)
    const defaultDuration = Math.min(60, maxDuration);
    setSessionDuration(defaultDuration);
    setSessionStart(slot.start);
    
    // Calculate cost based on duration
    calculateCost(defaultDuration, tutor.hourlyRate || 25);
  };
  
  // Helper function to convert time string to minutes
  const convertTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Helper function to convert minutes to time string (HH:MM)
  const convertMinutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Calculate the cost based on duration and hourly rate
  const calculateCost = (durationMinutes: number, hourlyRate: number) => {
    const durationHours = durationMinutes / 60;
    const cost = hourlyRate * durationHours;
    setCalculatedCost(cost);
  };
  
  // Handle duration slider change
  const handleDurationChange = (value: number[]) => {
    if (!selectedTimeSlot || !value.length) return;
    
    const newDuration = value[0];
    setSessionDuration(newDuration);
    
    // Calculate cost based on new duration
    calculateCost(newDuration, tutor.hourlyRate || 25);
  };
  
  // Get the maximum possible duration for the selected time slot
  const getMaxDuration = (): number => {
    if (!selectedTimeSlot) return 180; // Default max 3 hours
    
    const startTimeMinutes = convertTimeToMinutes(selectedTimeSlot.start);
    const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    
    // Cap at 3 hours or max available
    return Math.min(180, endTimeMinutes - startTimeMinutes);
  };
  
  // Format time for displaying the session start and end times
  const getSessionTimeRange = (): string => {
    if (!sessionStart || !sessionDuration || !selectedTimeSlot) return '';
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return `${formatTimeForDisplay(sessionStart)} - ${formatTimeForDisplay(endTime)}`;
  };
  
  // Function to get the final booking slot based on selected duration
  const getFinalBookingSlot = (): BookingSlot | null => {
    if (!selectedTimeSlot || !sessionStart || !sessionDuration) return null;
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return {
      tutorId: tutor.id, // Use the tutor.id directly instead of selectedTimeSlot.tutorId
      day: selectedTimeSlot.day,
      start: sessionStart,
      end: endTime,
      available: true
    };
  };
  
  // Handle confirming the session booking
  const handleConfirmBooking = () => {
    const bookingSlot = getFinalBookingSlot();
    if (bookingSlot) {
      onSelectSlot(bookingSlot);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
        <span className="ml-2">Loading tutor availability...</span>
      </div>
    );
  }
  
  if (!hasAvailability || availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-10 w-10 text-usc-cardinal mb-2" />
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
        <Label>1. Select Date</Label>
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
      
      {date && availableTimeSlotsForDate.length > 0 && (
        <div className="space-y-2">
          <Label>2. Select Available Time Block</Label>
          <ScrollArea className="h-[200px] border rounded-md p-2">
            <div className="space-y-2 p-2">
              {availableTimeSlotsForDate.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-left",
                    selectedTimeSlot === slot && "border-usc-cardinal bg-red-50"
                  )}
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      {formatTimeForDisplay(slot.start)} - {formatTimeForDisplay(slot.end)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {differenceInMinutes(
                      parseISO(`2000-01-01T${slot.end}`),
                      parseISO(`2000-01-01T${slot.start}`)
                    ) / 60} hours
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {selectedTimeSlot && (
        <div className="space-y-3 p-4 border rounded-md bg-muted/30">
          <Label>3. Choose Session Duration</Label>
          
          <div className="py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{getSessionTimeRange()}</span>
              {calculatedCost !== null && (
                <span className="font-bold text-usc-cardinal">${calculatedCost.toFixed(2)}</span>
              )}
            </div>
            
            <Slider
              defaultValue={[sessionDuration]}
              min={15}
              max={getMaxDuration()}
              step={15}
              value={[sessionDuration]}
              onValueChange={handleDurationChange}
              className="my-4"
            />
            
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>15 min</span>
              <span>{getMaxDuration() / 60} hours</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>Duration: {(sessionDuration / 60).toFixed(1)} hours</span>
            <span>Rate: ${tutor.hourlyRate || 25.00}/hour</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>4. Your Email</Label>
        <Input 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">A confirmation will be sent to this email address</p>
      </div>
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmBooking}
          disabled={!selectedTimeSlot || !sessionDuration}
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};
