
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { WeeklyAvailability, AvailabilitySlot } from "@/lib/scheduling/types";
import { DaySlotsList } from "./availability/DaySlotsList";
import { TimeSlotForm } from "./availability/TimeSlotForm";

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

    // Validate reasonable hours (6 AM - 11 PM)
    const startHour = parseInt(selectedStart.split(':')[0]);
    const endHour = parseInt(selectedEnd.split(':')[0]);
    if (startHour < 6 || endHour > 23 || (endHour === 23 && selectedEnd !== "23:00")) {
      toast({
        title: "Invalid Hours",
        description: "Tutoring hours must be between 6:00 AM and 11:00 PM.",
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
          <DaySlotsList 
            key={day}
            day={day}
            slots={slots}
            removeTimeSlot={removeTimeSlot}
            readOnly={readOnly}
          />
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
            
            <TimeSlotForm
              selectedDay={selectedDay}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              setSelectedStart={setSelectedStart}
              setSelectedEnd={setSelectedEnd}
              addTimeSlot={addTimeSlot}
              readOnly={readOnly}
            />
          </div>
        </div>
      )}
    </div>
  );
};
