
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BookingSlot } from "@/lib/scheduling/types";
import { SessionDurationSelector } from "./SessionDurationSelector";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Course } from "@/types/CourseTypes";

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
  consecutiveSlots: BookingSlot[];
  selectedCourseId?: string | null;
  courses?: Course[];
}

export function DurationSelector({
  selectedSlot,
  durationOptions,
  selectedDuration,
  onSelectDuration,
  onBack,
  onContinue,
  hourlyRate,
  consecutiveSlots,
  selectedCourseId,
  courses = []
}: DurationSelectorProps) {
  const [selectedStartTime, setSelectedStartTime] = React.useState(selectedSlot.start);
  
  // Calculate session time range
  const getSessionTimeRange = () => {
    const start = selectedStartTime;
    const startDate = parseISO(`2000-01-01T${start}`);
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + selectedDuration);
    return {
      start,
      end: format(endDate, "HH:mm")
    };
  };
  
  // Calculate cost
  const calculatedCost = (hourlyRate / 60) * selectedDuration;
  
  // Get the maximum available consecutive duration
  const getMaxDuration = () => {
    // If no consecutive slots, limit to default duration
    if (consecutiveSlots.length === 0) return 60;
    
    // Calculate the maximum duration based on consecutive slots
    const maxDurationMinutes = consecutiveSlots.reduce((total, slot) => {
      const slotStartTime = parseISO(`2000-01-01T${slot.start}`);
      const slotEndTime = parseISO(`2000-01-01T${slot.end}`);
      return total + differenceInMinutes(slotEndTime, slotStartTime);
    }, 0);
    
    // Cap at 180 minutes (3 hours) if longer
    return Math.min(maxDurationMinutes, 180);
  };
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTimeForDisplay = (time: string) => {
    try {
      const date = parseISO(`2000-01-01T${time}`);
      return format(date, "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      return time;
    }
  };
  
  // Get available start times within the selected and consecutive slots
  const getAvailableStartTimes = () => {
    if (consecutiveSlots.length === 0) return [selectedSlot.start];
    
    return consecutiveSlots.map(slot => slot.start);
  };
  
  // Find selected course by ID
  const selectedCourse = selectedCourseId 
    ? courses.find(c => c.course_number === selectedCourseId) 
    : null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={onBack} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h3 className="text-xl font-semibold ml-2">Set Duration</h3>
      </div>
      
      {/* Show selected course info */}
      {selectedCourseId ? (
        <div className="bg-muted/30 p-4 rounded-md mb-4">
          <p className="font-medium">Selected Class:</p>
          <p className="text-sm">
            {selectedCourse ? (
              <>
                <span className="font-medium">{selectedCourse.course_number}</span>
                {selectedCourse.course_title && (
                  <span className="text-muted-foreground"> - {selectedCourse.course_title}</span>
                )}
              </>
            ) : (
              <span>{selectedCourseId}</span>
            )}
          </p>
        </div>
      ) : (
        <div className="bg-muted/30 p-4 rounded-md mb-4">
          <p className="font-medium">General Tutoring Session</p>
          <p className="text-sm text-muted-foreground">Not specific to any particular class</p>
        </div>
      )}
      
      <SessionDurationSelector 
        sessionTimeRange={getSessionTimeRange()}
        calculatedCost={calculatedCost}
        sessionDuration={selectedDuration}
        onDurationChange={onSelectDuration}
        onStartTimeChange={setSelectedStartTime}
        maxDuration={getMaxDuration()}
        hourlyRate={hourlyRate}
        availableStartTimes={getAvailableStartTimes()}
        selectedStartTime={selectedStartTime}
        formatTimeForDisplay={formatTimeForDisplay}
      />
      
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          onClick={onContinue}
        >
          Book Session
        </Button>
      </div>
    </div>
  );
}
