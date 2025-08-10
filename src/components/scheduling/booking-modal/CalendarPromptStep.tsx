
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { format, parseISO, addMinutes } from "date-fns";
import { Check, Calendar, ArrowRight } from "lucide-react";
import { ICalEventData, downloadICSFile } from "@/lib/calendar/icsGenerator";
import { SessionType } from "@/contexts/SchedulingContext";
import { Badge } from "@/components/ui/badge";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const getSessionDate = () => {
    const slotDay = selectedSlot.day instanceof Date 
      ? selectedSlot.day 
      : new Date(selectedSlot.day);
      
    const [hour, minute] = selectedSlot.start.split(':').map(Number);
    
    const startDateTime = new Date(slotDay);
    startDateTime.setHours(hour, minute, 0, 0);
    
    return startDateTime;
  };
  
  const getFormattedDate = () => {
    const startDateTime = getSessionDate();
    return format(startDateTime, 'MMMM d, yyyy');
  };
  
  const getFormattedTime = () => {
    const startDateTime = getSessionDate();
    const endDateTime = addMinutes(startDateTime, selectedDuration);
    
    return `${format(startDateTime, 'h:mm a')} - ${format(endDateTime, 'h:mm a')}`;
  };
  
  const handleAddToCalendar = () => {
    const startDateTime = getSessionDate();
    const endDateTime = addMinutes(startDateTime, selectedDuration);
    
    const courseText = selectedCourseId 
      ? ` for ${selectedCourseId}` 
      : '';
      
    const sessionTypeText = sessionType === SessionType.VIRTUAL 
      ? 'virtual'
      : 'in-person';
      
    // Create event data for the calendar
    const eventData: ICalEventData = {
      title: `${sessionType === SessionType.VIRTUAL ? `Tutoring Session: ${selectedCourseId || 'General Tutoring'} (Virtual)` : `Tutoring Session with ${tutor.name}${courseText}`}`,
      description: sessionType === SessionType.VIRTUAL
        ? `Tutoring Session Details:\n` +
          `Course: ${selectedCourseId || 'General Tutoring'}\n` +
          `Tutor: ${tutor.name}\n` +
          `Duration: ${selectedDuration} minutes\n\n` +
          `JOIN ZOOM MEETING:\n` +
          `Link will be sent to your email\n` +
          `Meeting ID: N/A\n` +
          `Password: N/A\n` +
          `Backup: Dial +1-669-900-6833, enter meeting ID\n\n` +
          `Test Zoom: https://zoom.us/test`
        : `${sessionTypeText.charAt(0).toUpperCase() + sessionTypeText.slice(1)} tutoring session with ${tutor.name}${courseText}.\n\nDuration: ${selectedDuration} minutes`,
      location: sessionType === SessionType.VIRTUAL 
        ? 'Virtual - Zoom Meeting'
        : 'USC Campus',
      startDate: startDateTime,
      endDate: endDateTime
    };
    
    setIsDownloading(true);
    
    try {
      // Use the downloadICSFile function
      downloadICSFile(eventData, 'usc-tutoring-session.ics');
      setHasDownloaded(true);
    } catch (error) {
      console.error("Error downloading calendar file:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-3">
          <Check className="h-10 w-10 text-green-600" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">
        Session Booked!
      </h2>
      
      <p className="text-muted-foreground mb-6">
        Your {selectedDuration}-minute session with {tutor.firstName || tutor.name.split(' ')[0]} has been scheduled.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Session Details</h3>
            <p className="font-medium">{getFormattedDate()}</p>
            <p>{getFormattedTime()}</p>
            
            <div className="mt-2">
              <Badge className={sessionType === SessionType.VIRTUAL ? 
                "bg-blue-100 text-blue-800 hover:bg-blue-100" : 
                "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }>
                {sessionType === SessionType.VIRTUAL ? 'Virtual' : 'In-Person'}
              </Badge>
            </div>
          </div>
          
          {selectedCourseId && (
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p>{selectedCourseId}</p>
            </div>
          )}
          
          {sessionType === SessionType.VIRTUAL && (
            <div className="text-sm bg-blue-50 p-3 rounded border border-blue-100">
              <p>A Zoom link for this session has been created and will be sent to your email.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleAddToCalendar}
          disabled={isDownloading}
        >
          <Calendar className="h-4 w-4" />
          {isDownloading ? "Generating..." : "Add to Calendar"}
        </Button>
        
        <Button 
          onClick={onDone}
          className="flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      {hasDownloaded && (
        <p className="text-sm text-muted-foreground mt-2">
          Calendar file downloaded!
        </p>
      )}
    </div>
  );
}
