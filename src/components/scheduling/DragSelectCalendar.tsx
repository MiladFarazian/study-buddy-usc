
import React, { useState } from "react";
import { WeeklyAvailability } from "@/lib/scheduling-utils";
import { cn } from "@/lib/utils";

interface DragSelectCalendarProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  readOnly?: boolean;
  className?: string;
}

export const DragSelectCalendar: React.FC<DragSelectCalendarProps> = ({ 
  availability, 
  onChange,
  readOnly = false,
  className 
}) => {
  const [dragging, setDragging] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const times = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const isSlotAvailable = (day: string, time: string): boolean => {
    const dayAvailability = availability[day] || [];
    return dayAvailability.some(slot => time >= slot.start && time < slot.end);
  };

  const toggleSlot = (day: string, time: string) => {
    if (readOnly) return;

    const dayAvailability = availability[day] || [];
    const isCurrentlyAvailable = dayAvailability.some(slot => time >= slot.start && time < slot.end);

    let updatedAvailability = { ...availability };

    if (isCurrentlyAvailable) {
      // Remove the time slot
      updatedAvailability = {
        ...updatedAvailability,
        [day]: dayAvailability.filter(slot => !(time >= slot.start && time < slot.end))
      };
    } else {
      // Add the time slot
      const newSlot = { day: day, start: time, end: addMinutes(time, 30) };
      updatedAvailability = {
        ...updatedAvailability,
        [day]: [...dayAvailability, newSlot].sort((a, b) => a.start.localeCompare(b.start))
      };
    }

    onChange(updatedAvailability);
  };

  const handleMouseDown = (day: string, time: string) => {
    if (readOnly) return;
    
    setDragging(true);
    setSelectionStart(`${day}-${time}`);
    setCurrentSelection(`${day}-${time}`);
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    
    setDragging(false);
    setSelectionStart(null);
    setCurrentSelection(null);
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (readOnly) return;
    
    if (dragging) {
      setCurrentSelection(`${day}-${time}`);

      // Determine the slots to toggle based on the direction of the drag
      let startDay = selectionStart?.split('-')[0] || day;
      let startTime = selectionStart?.split('-')[1] || time;

      let endDay = day;
      let endTime = time;

      // Ensure start is before end
      if (days.indexOf(startDay) > days.indexOf(endDay) ||
          (days.indexOf(startDay) === days.indexOf(endDay) && startTime > endTime)) {
        [startDay, endDay] = [endDay, startDay];
        [startTime, endTime] = [endTime, startTime];
      }

      // Toggle slots within the selection range
      let currentDayIndex = days.indexOf(startDay);
      while (currentDayIndex <= days.indexOf(endDay)) {
        const currentDay = days[currentDayIndex];
        let currentTime = (currentDay === startDay) ? startTime : times[0];
        const endOfDayTime = (currentDay === endDay) ? endTime : times[times.length - 1];

        while (currentTime <= endOfDayTime) {
          toggleSlot(currentDay, currentTime);
          const timeIndex = times.indexOf(currentTime);
          currentTime = times[timeIndex + 1];
          if (!currentTime) break;
        }
        currentDayIndex++;
      }
    }
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  return (
    <div className={cn("grid grid-cols-[50px_repeat(7,1fr)] border rounded-md", className)}>
      <div className="py-2 font-medium">Time</div>
      {days.map(day => (
        <div key={day} className="py-2 font-medium text-center capitalize">
          {day}
        </div>
      ))}
      {times.map(time => (
        <React.Fragment key={time}>
          <div className="px-2 py-1 text-right text-sm text-muted-foreground">{time}</div>
          {days.map(day => {
            const isAvailable = isSlotAvailable(day, time);
            return (
              <div
                key={`${day}-${time}`}
                className={cn(
                  "border-t border-l last:border-r h-8 w-full relative",
                  isAvailable ? "bg-green-100 hover:bg-green-200" : "bg-white hover:bg-gray-100",
                  dragging ? "cursor-pointer" : "cursor-default"
                )}
                onMouseDown={() => handleMouseDown(day, time)}
                onMouseEnter={() => handleMouseEnter(day, time)}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {}} // Prevent "stuck" hover states
              >
                {isAvailable && <div className="absolute inset-0 bg-green-500 opacity-20" />}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
