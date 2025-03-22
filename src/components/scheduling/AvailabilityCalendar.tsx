
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getTutorAvailability, 
  updateTutorAvailability, 
  WeeklyAvailability, 
  AvailabilitySlot 
} from "@/lib/scheduling-utils";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { DragSelectCalendar } from "./DragSelectCalendar";

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

// Add proper props interface
interface AvailabilityCalendarProps {
  availability: WeeklyAvailability;
  onChange: (newAvailability: WeeklyAvailability) => void;
  readOnly?: boolean;
  className?: string;
}

export const AvailabilityCalendar = ({ 
  availability, 
  onChange, 
  readOnly = false,
  className
}: AvailabilityCalendarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState("monday");
  const [selectedStart, setSelectedStart] = useState("09:00");
  const [selectedEnd, setSelectedEnd] = useState("10:00");

  const addTimeSlot = () => {
    if (readOnly) return;
    
    // Validate time slot
    if (selectedStart >= selectedEnd) {
      toast({
        title: "Invalid Time Slot",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Check for overlapping slots
    const daySlots = availability[selectedDay] || [];
    const overlapping = daySlots.some(slot => {
      return (
        (selectedStart >= slot.start && selectedStart < slot.end) ||
        (selectedEnd > slot.start && selectedEnd <= slot.end) ||
        (selectedStart <= slot.start && selectedEnd >= slot.end)
      );
    });

    if (overlapping) {
      toast({
        title: "Overlapping Time Slot",
        description: "This time slot overlaps with an existing one.",
        variant: "destructive",
      });
      return;
    }

    // Add the new time slot
    const updatedAvailability = {
      ...availability,
      [selectedDay]: [
        ...(availability[selectedDay] || []),
        { day: selectedDay, start: selectedStart, end: selectedEnd }
      ].sort((a, b) => a.start.localeCompare(b.start))
    };
    
    onChange(updatedAvailability);
  };

  const removeTimeSlot = (day: string, slot: AvailabilitySlot) => {
    if (readOnly) return;
    
    const updatedAvailability = {
      ...availability,
      [day]: (availability[day] || []).filter(
        s => !(s.start === slot.start && s.end === slot.end)
      )
    };
    
    onChange(updatedAvailability);
  };

  const handleDayClick = (day: Date) => {
    setDate(day);
    const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day.getDay()];
    setSelectedDay(dayOfWeek);
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {Object.entries(availability).map(([day, slots]) => (
          <div key={day}>
            <h3 className="text-lg font-semibold capitalize">{day}</h3>
            <Separator className="my-2" />
            
            <div className="space-y-2 mt-2">
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No availability set for this day.
                </p>
              ) : (
                slots.map((slot, index) => (
                  <div 
                    key={`${day}-${index}`}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <span>
                      {slot.start} - {slot.end}
                    </span>
                    {!readOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeTimeSlot(day, slot)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      
      {!readOnly && (
        <div className="mt-6">
          <div className="flex flex-col space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDayClick}
              className="rounded-md border"
            />
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold capitalize">{selectedDay}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your available time slots for this day.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Select value={selectedStart} onValueChange={setSelectedStart}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>to</span>
                  <Select value={selectedEnd} onValueChange={setSelectedEnd}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={addTimeSlot} className="mt-2 md:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

