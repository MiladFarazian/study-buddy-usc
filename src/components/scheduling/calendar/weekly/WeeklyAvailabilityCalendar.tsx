
import React, { useState, useEffect } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHelpText } from './CalendarHelpText';
import { useSelectionState } from './hooks/useSelectionState';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeeklyAvailabilityCalendarProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  readOnly?: boolean;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export const WeeklyAvailabilityCalendar = ({
  availability,
  onChange,
  readOnly = false,
  onSave,
  isSaving = false
}: WeeklyAvailabilityCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const isMobile = useIsMobile();
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeekStart, i);
    return {
      date: day,
      name: format(day, 'EEE').toLowerCase(),
      fullName: format(day, 'EEEE').toLowerCase(),
      displayDate: format(day, 'MMM d')
    };
  });

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  
  const { 
    isSelecting,
    selectionMode,
    selectionStart,
    selectionEnd,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    isInCurrentSelection,
    isCellAvailable,
    updateAvailabilityFromSelection
  } = useSelectionState(availability, onChange, weekDays, readOnly);

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting, handleMouseUp]);

  return (
    <Card className="border shadow-sm">
      <CardContent className={isMobile ? "p-2 sm:p-3" : "p-4"}>
        <WeeklyCalendarHeader 
          currentWeekStart={currentWeekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
        
        <div className="overflow-x-auto">
          <div className={isMobile ? "min-w-[500px]" : "min-w-[700px]"}>
            <CalendarGrid 
              weekDays={weekDays}
              hours={hours}
              readOnly={readOnly}
              isCellAvailable={isCellAvailable}
              isInCurrentSelection={isInCurrentSelection}
              selectionMode={selectionMode}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
            />
          </div>
        </div>
        
        <div className={`${isMobile ? "flex-col space-y-3" : "flex justify-between items-center"} mt-4`}>
          <CalendarHelpText readOnly={readOnly} />
          
          {!readOnly && onSave && (
            <Button 
              onClick={onSave}
              disabled={isSaving}
              className={`bg-usc-cardinal hover:bg-usc-cardinal-dark ${isMobile ? "w-full" : ""}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
