
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { format, parseISO } from "date-fns";
import { CalendarPlus, Check } from "lucide-react";
import { useState } from "react";
import { downloadICS } from "@/lib/calendar/icsGenerator";
import { addToGoogleCalendar } from "@/lib/calendar/googleCalendarUtils";
import { SessionType } from "@/contexts/SchedulingContext";

interface CalendarPromptStepProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  selectedDuration: number;
  selectedCourseId: string | null;
  sessionType?: SessionType;
  onClose: () => void;
  onDone: () => void;
}

export function CalendarPromptStep({
  tutor,
  selectedSlot,
  selectedDuration,
  selectedCourseId,
  sessionType = SessionType.IN_PERSON,
  onClose,
  onDone
}: CalendarPromptStepProps) {
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  
  // Calculate the event times
  const startDate = new Date(selectedSlot.day);
  const [hours, minutes] = selectedSlot.start.split(':').map(Number);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(startDate.getMinutes() + selectedDuration);
  
  // Format the date and times for display
  const dateString = format(startDate, 'EEEE, MMMM d, yyyy');
  const timeString = `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  
  // Course info
  const courseText = selectedCourseId ? ` for ${selectedCourseId}` : '';
  
  // Session type text
  const sessionTypeText = sessionType === SessionType.VIRTUAL ? 'Virtual' : 'In-person';
  
  // Event title and description for calendar
  const eventTitle = `Tutoring with ${tutor.name}${courseText}`;
  const eventDescription = `${sessionTypeText} tutoring session with ${tutor.name}${courseText}. Duration: ${selectedDuration} minutes.`;
  
  const handleAddToCalendar = (type: 'google' | 'ics') => {
    setAddingToCalendar(true);
    
    try {
      if (type === 'google') {
        addToGoogleCalendar({
          title: eventTitle,
          description: eventDescription,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          location: sessionType === SessionType.VIRTUAL ? 'Virtual (Zoom)' : 'USC Campus'
        });
      } else {
        downloadICS({
          title: eventTitle,
          description: eventDescription,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          location: sessionType === SessionType.VIRTUAL ? 'Virtual (Zoom)' : 'USC Campus'
        });
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setAddingToCalendar(false);
    }
  };
  
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <Check className="h-6 w-6 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium mb-2">Session Successfully Booked!</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
        <p className="font-medium">Session Details:</p>
        <p className="text-sm text-gray-600 mt-1"><strong>Date:</strong> {dateString}</p>
        <p className="text-sm text-gray-600"><strong>Time:</strong> {timeString}</p>
        {selectedCourseId && (
          <p className="text-sm text-gray-600"><strong>Course:</strong> {selectedCourseId}</p>
        )}
        <p className="text-sm text-gray-600">
          <strong>Session Type:</strong> {sessionTypeText}
        </p>
        <p className="text-sm text-gray-600"><strong>Tutor:</strong> {tutor.name}</p>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        Would you like to add this session to your calendar?
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
        <Button
          variant="outline"
          className="flex items-center justify-center"
          onClick={() => handleAddToCalendar('google')}
          disabled={addingToCalendar}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </Button>
        
        <Button
          variant="outline"
          className="flex items-center justify-center"
          onClick={() => handleAddToCalendar('ics')}
          disabled={addingToCalendar}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          Download .ics File
        </Button>
      </div>
      
      <div className="mt-6">
        <Button onClick={onDone} className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white">
          Done
        </Button>
      </div>
    </div>
  );
}
