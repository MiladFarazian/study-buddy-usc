
import { useState, useEffect, useRef } from 'react';
import { format, addDays, parseISO, startOfWeek, eachDayOfInterval, addMinutes, differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { 
  getTutorAvailability, 
  getTutorBookedSessions, 
  generateAvailableSlots, 
  BookingSlot 
} from "@/lib/scheduling-utils";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarDragProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
}

export const BookingCalendarDrag = ({ tutor, onSelectSlot }: BookingCalendarDragProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number, minute: number, day: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Hours to display in the calendar (24-hour format)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  
  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id, startDate]);
  
  useEffect(() => {
    // Generate array of dates for the week
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });
    setWeekDays(days);
  }, [startDate]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      // Get tutor's availability settings
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        toast({
          title: "No Availability",
          description: "This tutor hasn't set their availability yet.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Get tutor's booked sessions
      const bookedSessions = await getTutorBookedSessions(tutor.id, startDate, addDays(startDate, 6));
      
      // Generate available slots
      const slots = generateAvailableSlots(availability, bookedSessions, startDate, 7);
      
      // Add tutor ID to each slot
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      setAvailableSlots(slotsWithTutor);
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (hour: number, minute: number, dayIndex: number) => {
    const slot = getSlotAt(weekDays[dayIndex], `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    if (!slot || !slot.available) return;
    
    setIsDragging(true);
    setDragStart({ hour, minute, day: dayIndex });
    setDragEnd({ hour, minute, day: dayIndex });
  };

  const handleMouseMove = (hour: number, minute: number, dayIndex: number) => {
    if (!isDragging || !dragStart) return;
    
    // Only allow dragging within the same day
    if (dragStart.day !== dayIndex) return;
    
    // Ensure the time is available
    const slot = getSlotAt(weekDays[dayIndex], `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    if (!slot || !slot.available) return;
    
    setDragEnd({ hour, minute, day: dayIndex });
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      // Create a booking slot from the dragged selection
      createBookingFromDrag();
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const createBookingFromDrag = () => {
    if (!dragStart || !dragEnd) return;
    
    // Ensure start is before end
    let startCoord = dragStart;
    let endCoord = dragEnd;
    
    if (
      (startCoord.hour > endCoord.hour) || 
      (startCoord.hour === endCoord.hour && startCoord.minute > endCoord.minute)
    ) {
      // Swap if start is after end
      [startCoord, endCoord] = [endCoord, startCoord];
    }
    
    const day = weekDays[startCoord.day];
    const startTime = `${startCoord.hour.toString().padStart(2, '0')}:${startCoord.minute.toString().padStart(2, '0')}`;
    
    // End time is 15 minutes after the selected end cell
    let endHour = endCoord.hour;
    let endMinute = endCoord.minute + 15;
    
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Verify that the entire time range is available
    const allSlotsAvailable = verifyRangeAvailability(day, startTime, endTime);
    
    if (!allSlotsAvailable) {
      toast({
        title: "Invalid Selection",
        description: "The entire time range must be available for booking.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a booking slot
    const bookingSlot: BookingSlot = {
      tutorId: tutor.id,
      day: day,
      start: startTime,
      end: endTime,
      available: true
    };
    
    setSelectedSlot(bookingSlot);
    onSelectSlot(bookingSlot);
  };

  const verifyRangeAvailability = (day: Date, startTime: string, endTime: string): boolean => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    // Check every 15-minute slot in the range
    for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 15) {
      const timeString = formatTimeFromMinutes(currentMinutes);
      const slot = getSlotAt(day, timeString);
      
      if (!slot || !slot.available) {
        return false;
      }
    }
    
    return true;
  };

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeFromMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const handleSelectSlot = (slot: BookingSlot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    onSelectSlot(slot);
  };
  
  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };
  
  // Function to get slot for a specific day and time
  const getSlotAt = (day: Date, timeString: string): BookingSlot | undefined => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return availableSlots.find(slot => 
      format(slot.day, 'yyyy-MM-dd') === dayStr && 
      slot.start === timeString
    );
  };

  // Function to check if a cell is within the dragged range
  const isInDragRange = (hour: number, minute: number, dayIndex: number): boolean => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.day !== dayIndex || dragEnd.day !== dayIndex) {
      return false;
    }
    
    // Convert to total minutes for easier comparison
    const cellMinutes = hour * 60 + minute;
    const startMinutes = dragStart.hour * 60 + dragStart.minute;
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
    
    // Check if cell is within range (inclusive of start and end)
    return (
      (cellMinutes >= Math.min(startMinutes, endMinutes) && 
       cellMinutes <= Math.max(startMinutes, endMinutes))
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Book a Session</CardTitle>
        <CardDescription>
          Select a time slot for your tutoring session with {tutor.firstName || tutor.name.split(' ')[0]}.
          You can click and drag to select a range of time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <h3 className="text-lg font-medium">
            Week of {format(startDate, 'MMM d, yyyy')}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <div 
          className="border rounded-md overflow-hidden"
          ref={calendarRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header row with days of the week */}
          <div className="grid grid-cols-8 bg-muted">
            <div className="p-2 border-r text-center font-medium text-sm">Time</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-2 border-r last:border-r-0 text-center font-medium text-sm">
                <div>{format(day, 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots grid */}
          <div className="max-h-[500px] overflow-y-auto">
            {hours.map((hour) => (
              [0, 15, 30, 45].map((minute, minuteIndex) => {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                return (
                  <div key={`${hour}-${minute}`} className="grid grid-cols-8 border-t">
                    {/* Time column */}
                    {minuteIndex === 0 && (
                      <div className="p-2 border-r text-sm text-center row-span-4">
                        {format(new Date().setHours(hour, 0), 'h a')}
                      </div>
                    )}
                    {minuteIndex !== 0 && <div className="p-2 border-r text-sm text-center invisible">.</div>}
                    
                    {/* Days columns */}
                    {weekDays.map((day, dayIndex) => {
                      const slot = getSlotAt(day, timeString);
                      const isAvailable = slot?.available;
                      const isSelected = selectedSlot && 
                                         format(selectedSlot.day, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && 
                                         selectedSlot.start === timeString;
                      const isInDrag = isInDragRange(hour, minute, dayIndex);
                      
                      return (
                        <div
                          key={`${timeString}-${dayIndex}`}
                          className={`
                            h-8 border-r last:border-r-0 transition-colors cursor-default
                            ${isAvailable ? 'cursor-pointer hover:bg-green-50' : 'bg-gray-100 opacity-50'}
                            ${isSelected ? 'bg-usc-cardinal text-white' : ''}
                            ${isInDrag && isAvailable ? 'bg-usc-gold' : ''}
                          `}
                          onMouseDown={() => isAvailable && handleMouseDown(hour, minute, dayIndex)}
                          onMouseMove={() => handleMouseMove(hour, minute, dayIndex)}
                        >
                          {minute === 0 && isAvailable && (
                            <div className="h-1 w-full bg-green-500"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ))}
          </div>
        </div>
        
        {selectedSlot && (
          <div className="mt-4 p-3 border rounded-md bg-muted/30">
            <h4 className="font-medium">Selected Time Slot:</h4>
            <div className="flex items-center mt-2">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center mt-1">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{selectedSlot.start} - {selectedSlot.end}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Rate: ${tutor.hourlyRate.toFixed(2)}/hour
        </p>
      </CardFooter>
    </Card>
  );
};
