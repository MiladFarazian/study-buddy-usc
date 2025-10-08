
import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHelpText } from './CalendarHelpText';
import { useSelectionState } from './hooks/useSelectionState';
import { Loader2 } from 'lucide-react';

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
  const weekDays = [
    { name: 'sun', fullName: 'sunday', displayName: 'Sunday' },
    { name: 'mon', fullName: 'monday', displayName: 'Monday' },
    { name: 'tue', fullName: 'tuesday', displayName: 'Tuesday' },
    { name: 'wed', fullName: 'wednesday', displayName: 'Wednesday' },
    { name: 'thu', fullName: 'thursday', displayName: 'Thursday' },
    { name: 'fri', fullName: 'friday', displayName: 'Friday' },
    { name: 'sat', fullName: 'saturday', displayName: 'Saturday' }
  ];

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM - 11 PM
  
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
      <CardContent className="p-4">
        <WeeklyCalendarHeader />
        
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
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
        
        <div className="flex justify-between items-center mt-4">
          <CalendarHelpText readOnly={readOnly} />
          
          {!readOnly && onSave && (
            <Button 
              onClick={onSave}
              disabled={isSaving}
              className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
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
