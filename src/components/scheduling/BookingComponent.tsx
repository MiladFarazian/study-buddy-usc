
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BookingComponentProps {
  tutor: Tutor;
  availableSlots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  onCancel: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function BookingComponent({ 
  tutor, 
  availableSlots,
  onSelectSlot,
  onCancel,
  loading = false,
  disabled = false
}: BookingComponentProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  // Group slots by date
  const slotsByDate = availableSlots.reduce<Record<string, BookingSlot[]>>(
    (acc, slot) => {
      const date = format(new Date(slot.startTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    },
    {}
  );
  
  // Get available dates in the current week
  const availableDates = Object.keys(slotsByDate)
    .filter(date => {
      const dateObj = new Date(date);
      const weekEnd = addDays(currentWeekStart, 6);
      return dateObj >= currentWeekStart && dateObj <= weekEnd;
    })
    .sort();
  
  // Previous and next week navigation
  const handlePrevWeek = () => {
    setCurrentWeekStart(prevWeek => addWeeks(prevWeek, -1));
    setSelectedDate(null);
    setSelectedTime(null);
  };
  
  const handleNextWeek = () => {
    setCurrentWeekStart(prevWeek => addWeeks(prevWeek, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };
  
  // When date is selected, update available times
  useEffect(() => {
    if (selectedDate) {
      const slots = slotsByDate[selectedDate] || [];
      const times = [...new Set(slots.map(slot => 
        format(new Date(slot.startTime), 'HH:mm')
      ))].sort();
      setAvailableTimes(times);
      setSelectedTime(null);
    } else {
      setAvailableTimes([]);
      setSelectedTime(null);
    }
  }, [selectedDate, slotsByDate]);
  
  // Handle final slot selection
  const handleConfirmBooking = () => {
    if (selectedDate && selectedTime && !disabled) {
      const dateTimeString = `${selectedDate}T${selectedTime}:00`;
      const startTime = new Date(dateTimeString);
      const endTime = new Date(startTime.getTime() + (selectedDuration * 60000));
      
      const slot: BookingSlot = {
        id: `${selectedDate}-${selectedTime}-${selectedDuration}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: selectedDuration,
        tutorId: tutor.id
      };
      
      onSelectSlot(slot);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select Date & Time</h3>

        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevWeek}
            disabled={disabled}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Week
          </Button>
          
          <div className="text-sm font-medium">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextWeek}
            disabled={disabled}
          >
            Next Week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">Available dates</Label>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {availableDates.length > 0 ? (
              availableDates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  onClick={() => setSelectedDate(date)}
                  className="justify-start"
                  disabled={disabled}
                >
                  {format(new Date(date), 'EEE, MMM d')}
                </Button>
              ))
            ) : (
              <div className="col-span-3 text-muted-foreground text-center py-4">
                No availability this week
              </div>
            )}
          </div>
        </div>

        {selectedDate && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Available times</Label>
              <div className="grid grid-cols-4 gap-2">
                {availableTimes.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    disabled={disabled}
                  >
                    {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Session Duration</Label>
              <Select 
                value={selectedDuration.toString()} 
                onValueChange={(value) => setSelectedDuration(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
        
        <Button 
          onClick={handleConfirmBooking} 
          disabled={!selectedDate || !selectedTime || disabled}
          className={disabled ? "opacity-50 cursor-not-allowed" : ""}
        >
          Book Session
        </Button>
      </div>
    </div>
  );
}
