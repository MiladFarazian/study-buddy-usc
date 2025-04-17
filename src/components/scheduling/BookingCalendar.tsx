import { useState, useEffect } from "react";
import { format, addDays, parseISO, addMinutes, differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { 
  getTutorAvailability, 
  getTutorBookedSessions, 
  generateAvailableSlots, 
  BookingSlot 
} from "@/lib/scheduling";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Loader2, Clock, AlertCircle } from "lucide-react";
import { formatTimeDisplay } from "@/lib/scheduling/time-utils";

interface BookingCalendarProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
}

export const BookingCalendar = ({ tutor, onSelectSlot }: BookingCalendarProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [visibleSlots, setVisibleSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [hasAvailability, setHasAvailability] = useState(true);

  useEffect(() => {
    if (tutor.id) {
      loadAvailability();
    }
  }, [tutor.id]);

  useEffect(() => {
    if (selectedDate && availableSlots.length > 0) {
      const slotsForDate = availableSlots.filter(
        slot => {
          const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
          return format(slotDay, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        }
      );
      setVisibleSlots(slotsForDate);
    }
  }, [selectedDate, availableSlots]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      console.log("Loading availability for tutor:", tutor.id);
      const availability = await getTutorAvailability(tutor.id);
      
      if (!availability) {
        console.log("No availability found for tutor:", tutor.id);
        setHasAvailability(false);
        setLoading(false);
        return;
      }
      
      const hasAnySlots = Object.values(availability).some(daySlots => Array.isArray(daySlots) && daySlots.length > 0);
      
      if (!hasAnySlots) {
        console.log("Tutor has no availability slots set:", tutor.id);
        setHasAvailability(false);
        setLoading(false);
        return;
      }
      
      const today = new Date();
      const bookedSessions = await getTutorBookedSessions(tutor.id, today, addDays(today, 28));
      
      const slots = generateAvailableSlots(availability, bookedSessions, today, 28);
      
      const slotsWithTutor = slots.map(slot => ({
        ...slot,
        tutorId: tutor.id
      }));
      
      console.log(`Generated ${slotsWithTutor.length} available slots for tutor: ${tutor.id}`);
      setAvailableSlots(slotsWithTutor);
      
      const todaySlots = slotsWithTutor.filter(
        slot => {
          const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
          return format(slotDay, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        }
      );
      setVisibleSlots(todaySlots);
      
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

  const handleSelectSlot = (slot: BookingSlot) => {
    if (!slot.available) return;
    
    setSelectedSlot(slot);
    onSelectSlot(slot);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const getDatesWithSlots = () => {
    const dates = new Set<string>();
    availableSlots.forEach(slot => {
      if (slot.available) {
        const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
        dates.add(format(slotDay, 'yyyy-MM-dd'));
      }
    });
    return Array.from(dates).map(dateStr => parseISO(dateStr));
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

  if (!hasAvailability) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Availability Set</h3>
            <p className="text-muted-foreground max-w-md">
              This tutor hasn't set their availability yet. Please check back later or try another tutor.
            </p>
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
          Select a date and time for your tutoring session with {tutor.firstName || tutor.name.split(' ')[0]}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">Select a Date:</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) return true;
                
                const fourWeeksFromNow = addDays(today, 28);
                if (date > fourWeeksFromNow) return true;
                
                const dateStr = format(date, 'yyyy-MM-dd');
                return !getDatesWithSlots().some(d => format(d, 'yyyy-MM-dd') === dateStr);
              }}
              className="rounded-md border"
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Available Time Slots:</p>
            <div className="h-64 overflow-y-auto pr-2 border rounded-md p-2">
              {visibleSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-2" />
                  <p>No available slots for this date.</p>
                  <p className="text-sm mt-1">Please select another date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {visibleSlots
                    .filter(slot => slot.available)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((slot, index) => {
                      const slotDay = slot.day instanceof Date ? slot.day : new Date(slot.day);
                      
                      return (
                        <div
                          key={`${format(slotDay, 'yyyy-MM-dd')}-${slot.start}-${index}`}
                          className={`
                            rounded-md border p-3 cursor-pointer transition-colors
                            ${selectedSlot && 
                              selectedSlot.day instanceof Date && slotDay instanceof Date ?
                              (selectedSlot.day.getTime() === slotDay.getTime() && 
                              selectedSlot.start === slot.start
                              ? 'border-usc-cardinal bg-red-50' : '')
                              : 'hover:border-usc-cardinal hover:bg-red-50/50'
                            }
                          `}
                          onClick={() => handleSelectSlot(slot)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{formatTimeDisplay(slot.start)}</p>
                              <div className="flex items-center mt-1 text-muted-foreground text-sm">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>30 minutes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Rate: ${tutor.hourlyRate.toFixed(2)}/hour
        </p>
      </CardFooter>
    </Card>
  );
};
