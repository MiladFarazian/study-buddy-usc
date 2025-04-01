
import React, { useState } from "react";
import { WeeklyAvailability, AvailabilitySlot } from "@/types/scheduling";
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
  const [dragAction, setDragAction] = useState<'add' | 'remove'>('add');

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const isSlotAvailable = (day: string, hour: number): boolean => {
    const dayAvailability = availability[day] || [];
    const time = `${String(hour).padStart(2, '0')}:00`;
    return dayAvailability.some(slot => 
      time >= slot.start && time < slot.end
    );
  };

  const toggleSlot = (day: string, hour: number, action?: 'add' | 'remove') => {
    if (readOnly) return;

    const time = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    
    const currentAction = action || (isSlotAvailable(day, hour) ? 'remove' : 'add');
    
    let updatedAvailability = { ...availability };
    
    if (currentAction === 'add') {
      // Add the time slot
      const newSlot: AvailabilitySlot = { 
        day, 
        start: time, 
        end: endTime 
      };
      
      const existingSlots = updatedAvailability[day] || [];
      updatedAvailability = {
        ...updatedAvailability,
        [day]: [...existingSlots, newSlot]
      };
    } else {
      // Remove the time slot
      const daySlots = updatedAvailability[day] || [];
      updatedAvailability = {
        ...updatedAvailability,
        [day]: daySlots.filter(slot => 
          !(time >= slot.start && time < slot.end)
        )
      };
    }
    
    onChange(updatedAvailability);
  };

  const handleMouseDown = (day: string, hour: number) => {
    if (readOnly) return;
    
    setDragging(true);
    setSelectionStart(`${day}-${hour}`);
    setCurrentSelection(`${day}-${hour}`);
    
    // Determine if we're adding or removing slots
    setDragAction(isSlotAvailable(day, hour) ? 'remove' : 'add');
    
    // Toggle the initial slot
    toggleSlot(day, hour, dragAction);
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    
    setDragging(false);
    setSelectionStart(null);
    setCurrentSelection(null);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (!dragging || readOnly) return;
    
    setCurrentSelection(`${day}-${hour}`);
    toggleSlot(day, hour, dragAction);
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour} ${period}`;
  };

  return (
    <div 
      className={cn("select-none", className)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="grid grid-cols-[100px_repeat(7,1fr)]">
        <div className="p-2 font-medium text-center">Time</div>
        {days.map(day => (
          <div key={day} className="p-2 font-medium text-center capitalize">
            {day.slice(0, 3)}
          </div>
        ))}
        
        {hours.filter(hour => hour >= 8 && hour < 22).map(hour => (
          <React.Fragment key={hour}>
            <div className="p-2 text-sm text-right border-t">
              {formatHour(hour)}
            </div>
            {days.map(day => {
              const isAvailable = isSlotAvailable(day, hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "border-t border-l h-10 cursor-pointer transition-colors",
                    isAvailable ? "bg-green-100 hover:bg-green-200" : "bg-white hover:bg-gray-100",
                    readOnly && "cursor-default"
                  )}
                  onMouseDown={() => handleMouseDown(day, hour)}
                  onMouseEnter={() => handleMouseEnter(day, hour)}
                >
                  {isAvailable && <div className="w-full h-full bg-green-500 opacity-20" />}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
