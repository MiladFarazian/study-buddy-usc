
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";
import { ICalEventData } from "@/lib/calendar/icsGenerator";
import { CalendarPlus, Check } from "lucide-react";
import { useState } from "react";
import { downloadICSFile } from "@/lib/calendar/icsGenerator";
import { addToGoogleCalendar } from "@/lib/calendar/googleCalendarUtils";
import { SessionType } from "@/contexts/SchedulingContext";

interface CalendarPromptStepProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  selectedDuration: number;
  selectedCourseId: string | null;
  sessionType: SessionType;
  onClose: () => void;
  onDone: () => void;
}

export function CalendarPromptStep({
  tutor,
  selectedSlot,
  selectedDuration,
  selectedCourseId,
  sessionType,
  onClose,
  onDone
}: CalendarPromptStepProps) {
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  
  // Format the date and time for display
  const day = selectedSlot.day instanceof Date ? selectedSlot.day : new Date(selectedSlot.day);
  const startHour = selectedSlot.start.split(':')[0];
  const startMinute = selectedSlot.start.split(':')[1];
  
  const startDate = new Date(day);
  startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + selectedDuration);
  
  const sessionTypeText = sessionType === SessionType.VIRTUAL ? 'Virtual Session (Zoom)' : 'In-Person Session';
  const courseName = selectedCourseId ? `${selectedCourseId}` : 'General Tutoring';

  // Function to add to calendar
  const handleAddToCalendar = () => {
    const eventData: ICalEventData = {
      title: `Tutoring: ${courseName} with ${tutor.name}`,
      description: `${sessionTypeText} with ${tutor.name} for ${courseName}.${sessionType === SessionType.VIRTUAL ? '\n\nThis is a virtual session. A Zoom link will be provided.' : ''}`,
      location: sessionType === SessionType.VIRTUAL ? 'Zoom' : 'USC Campus',
      startDate: startDate,
      endDate: endDate
    };
    
    downloadICSFile(eventData);
    setAddedToCalendar(true);
  };
  
  // Function to add to Google Calendar
  const handleAddToGoogleCalendar = () => {
    const eventData = {
      title: `Tutoring: ${courseName} with ${tutor.name}`,
      description: `${sessionTypeText} with ${tutor.name} for ${courseName}.${sessionType === SessionType.VIRTUAL ? '\n\nThis is a virtual session. A Zoom link will be provided.' : ''}`,
      location: sessionType === SessionType.VIRTUAL ? 'Zoom' : 'USC Campus',
      startDate: startDate,
      endDate: endDate
    };
    
    addToGoogleCalendar(eventData);
    setAddedToCalendar(true);
  };
  
  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Session Booked!</h2>
        <p className="text-gray-500 mt-2">
          Your session has been scheduled successfully.
        </p>
      </div>
      
      <Card className="p-6 bg-gray-50 space-y-3">
        <div>
          <p className="font-semibold">{courseName}</p>
          <p>{sessionTypeText}</p>
        </div>
        <div>
          <p className="font-semibold">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
          <p>{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}</p>
        </div>
        <div>
          <p className="font-semibold">With {tutor.name}</p>
          <p className="text-sm text-gray-500">${tutor.hourlyRate ? ((tutor.hourlyRate / 60) * selectedDuration).toFixed(2) : "25.00"}</p>
        </div>
      </Card>
      
      <div className="border rounded-md p-6 space-y-3">
        <p className="font-semibold">Add to your calendar</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleAddToCalendar} 
            variant="outline" 
            className="flex items-center"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Download Calendar File
          </Button>
          <Button 
            onClick={handleAddToGoogleCalendar}
            variant="outline" 
            className="flex items-center"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add to Google Calendar
          </Button>
        </div>
        
        {addedToCalendar && (
          <div className="text-green-600 flex items-center justify-center">
            <Check className="h-4 w-4 mr-2" />
            Added to calendar
          </div>
        )}
      </div>
      
      <Button onClick={onDone} className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white">
        Done
      </Button>
    </div>
  );
}
