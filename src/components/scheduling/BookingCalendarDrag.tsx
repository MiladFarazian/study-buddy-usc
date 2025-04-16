import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tutor } from "@/types/tutor";
import { BookingSlot, mapDateToDayOfWeek } from "@/lib/scheduling";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";

// Import refactored components
import { useAvailabilityData } from "./calendar/useAvailabilityData";
import { useDragSelection } from "./calendar/useDragSelection";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarDaysHeader } from "./calendar/CalendarDaysHeader";
import { TimeGrid } from "./calendar/TimeGrid";
import { SelectedTimeDisplay } from "./calendar/SelectedTimeDisplay";
import { NoAvailabilityDisplay } from "./calendar/NoAvailabilityDisplay";
import { LoadingDisplay } from "./calendar/LoadingDisplay";

interface BookingCalendarDragProps {
  tutor: Tutor;
  onSelectSlot: (slot: BookingSlot) => void;
  onClose?: () => void;
}

export const BookingCalendarDrag = ({ tutor, onSelectSlot, onClose }: BookingCalendarDragProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Initialize state
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Memoize the weekDays to prevent unnecessary recalculations
  const weekDays = useMemo(() => {
    // Generate array of dates for the week
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });
    
    // Debug log which days we're showing
    days.forEach(day => {
      console.log(`Calendar showing ${format(day, 'yyyy-MM-dd')} (${mapDateToDayOfWeek(day)})`);
    });
    
    return days;
  }, [startDate]);
  
  // Custom hooks
  const { loading, availableSlots, hasAvailability, errorMessage, refreshAvailability } = useAvailabilityData(tutor, startDate);
  const { 
    isDragging, 
    selectedSlot, 
    calendarRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp, 
    isInDragRange,
    getSlotAt
  } = useDragSelection(availableSlots, onSelectSlot);
  
  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };
  
  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };
  
  const handleLogin = () => {
    navigate('/login');
  };

  console.log("BookingCalendarDrag render state:", { 
    tutorId: tutor?.id,
    loading, 
    hasAvailability, 
    availableSlotsCount: availableSlots.length, 
    errorMessage,
    userLoggedIn: !!user
  });

  if (loading) {
    return <LoadingDisplay message="Loading tutor's availability schedule..." />;
  }

  if (!hasAvailability) {
    return (
      <NoAvailabilityDisplay 
        reason={errorMessage || "This tutor hasn't set their availability yet."}
        onRetry={refreshAvailability}
        onLogin={handleLogin}
      />
    );
  }

  // Display a message if there are no slots for the current week
  if (availableSlots.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col justify-center items-center h-64 text-center">
            <h3 className="text-lg font-medium mb-2">No Available Times</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              No availability for the selected week. Try another week or check back later.
            </p>
            <div className="flex space-x-4 mt-2">
              <Button onClick={handlePrevWeek} variant="outline">Previous Week</Button>
              <Button onClick={handleNextWeek} variant="outline">Next Week</Button>
              <Button onClick={refreshAvailability} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Book a Session</CardTitle>
            <CardDescription>
              Select a time slot for your tutoring session with {tutor.firstName || tutor.name.split(' ')[0]}.
              {!isDragging && " You can click and drag to select a range of time."}
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CalendarHeader 
          startDate={startDate}
          weekDays={weekDays}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
        
        <div 
          className="border rounded-md overflow-x-auto"
          ref={calendarRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchEnd={handleMouseUp}
        >
          <CalendarDaysHeader weekDays={weekDays} />
          
          <TimeGrid 
            hours={Array.from({ length: 14 }, (_, i) => i + 8)} // 8 AM to 9 PM
            weekDays={weekDays}
            getSlotAt={getSlotAt}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            selectedSlot={selectedSlot}
            isInDragRange={isInDragRange}
          />
        </div>
        
        <SelectedTimeDisplay selectedSlot={selectedSlot} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Rate: ${tutor.hourlyRate?.toFixed(2) || "25.00"}/hour
        </p>
      </CardFooter>
    </Card>
  );
};
