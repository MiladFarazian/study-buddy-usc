
import React from 'react';
import { Button } from "@/components/ui/button";
import { BookingSlot } from "@/lib/scheduling/types";
import { format } from "date-fns";
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        {durationOptions.map((option) => (
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
          disabled={!selectedDuration}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
