
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";

interface DurationOption {
  minutes: number;
  cost: number;
}

interface DurationSelectorProps {
  selectedSlot: BookingSlot;
  durationOptions: DurationOption[];
  selectedDuration: number;
  onSelectDuration: (minutes: number) => void;
  onBack: () => void;
  onContinue: () => void;
  hourlyRate: number;
}

export function DurationSelector({
  selectedSlot,
  durationOptions,
  selectedDuration,
  onSelectDuration,
  onBack,
  onContinue,
  hourlyRate
}: DurationSelectorProps) {
  // Calculate available duration in minutes for the selected slot
  const calculateAvailableDuration = () => {
    // If end time is provided in the slot, calculate the difference
    if (selectedSlot.end) {
      const [startHour, startMinute] = selectedSlot.start.split(':').map(Number);
      const [endHour, endMinute] = selectedSlot.end.split(':').map(Number);
      
      // Handle cases where end time might be on the next day (e.g., 11:30 PM to 12:30 AM)
      let endMinutes = endHour * 60 + endMinute;
      const startMinutes = startHour * 60 + startMinute;
      
      if (endMinutes < startMinutes) {
        // Add 24 hours in minutes if end time is on the next day
        endMinutes += 24 * 60;
      }
      
      return endMinutes - startMinutes;
    }
    
    // Default to 120 minutes (2 hours) if no end time is specified
    // This is a reasonable default for tutoring sessions
    return 120;
  };

  // Calculate the available duration
  const availableDuration = calculateAvailableDuration();
  
  console.log("Available duration for slot:", availableDuration, "minutes");
  console.log("Selected slot:", selectedSlot);

  // Filter duration options based on available time
  const availableDurationOptions = durationOptions.filter(option => {
    return option.minutes <= availableDuration;
  });
  
  // If current selected duration is not available, reset it
  React.useEffect(() => {
    if (selectedDuration && !availableDurationOptions.find(opt => opt.minutes === selectedDuration)) {
      // Select the longest available duration by default
      if (availableDurationOptions.length > 0) {
        const longestAvailableDuration = Math.max(...availableDurationOptions.map(opt => opt.minutes));
        onSelectDuration(longestAvailableDuration);
      } else {
        // If no available options (shouldn't happen), default to the shortest option
        const shortestDuration = Math.min(...durationOptions.map(opt => opt.minutes));
        onSelectDuration(shortestDuration);
      }
    } else if (!selectedDuration && availableDurationOptions.length > 0) {
      // If no duration is selected yet, select the default one
      onSelectDuration(availableDurationOptions[0].minutes);
    }
  }, [selectedDuration, availableDurationOptions, durationOptions, onSelectDuration]);

  // Format the date for display
  const slotDay = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
  const formattedDate = format(slotDay, 'EEEE, MMMM d, yyyy');
  
  // Format time for display (e.g., convert "14:30" to "2:30 PM")
  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-md mb-6">
        <div className="flex items-center mb-2">
          <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-medium">{formatTimeDisplay(selectedSlot.start)}</span>
        </div>
      </div>
    
      <h2 className="text-2xl font-bold">Select Session Duration</h2>
      
      {availableDurationOptions.length === 0 ? (
        <div className="p-6 text-center border rounded-md">
          <p className="text-muted-foreground">
            No duration options available for this time slot. Please select another time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {availableDurationOptions.map((option) => (
            <Button
              key={option.minutes}
              type="button"
              variant="outline"
              className={`
                h-32 flex flex-col items-center justify-center p-6 border rounded-md relative
                ${selectedDuration === option.minutes 
                  ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                  : "bg-white hover:bg-gray-50"}
              `}
              onClick={() => onSelectDuration(option.minutes)}
            >
              <span className="text-xl font-bold mb-2">
                {option.minutes} minutes
              </span>
              <span className="text-xl">
                ${option.cost.toFixed(2)}
              </span>
              
              {selectedDuration === option.minutes && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-usc-cardinal rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Rate: ${hourlyRate.toFixed(2)}/hour
      </p>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          className="px-8"
          onClick={onBack}
        >
          Back
        </Button>
        
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white px-8"
          onClick={onContinue}
          disabled={!selectedDuration || availableDurationOptions.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
