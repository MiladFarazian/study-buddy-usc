
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { formatDate, formatTime } from "@/lib/scheduling/time-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Clock, BookOpen, MapPin, Video, User, Check, ArrowLeft, Apple } from "lucide-react";
import { SessionType } from "@/contexts/SchedulingContext";
import { toast } from "sonner";
import { format, addMinutes, parseISO } from "date-fns";
import { generateGoogleCalendarUrl } from "@/lib/calendar/googleCalendarUtils";
import { ICalEventData, downloadICSFile } from "@/lib/calendar/icsGenerator";

export function ConfirmationStep() {
  const { state, tutor } = useScheduling();
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  
  if (!tutor) {
    return <div>Loading tutor information...</div>;
  }

  // Format selected time
  const formatTimeSlot = () => {
    if (!state.selectedTimeSlot) return "No time selected";
    
    const start = formatTime(state.selectedTimeSlot.start);
    const totalMinutes = state.selectedDuration || 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const durationText = hours > 0 
      ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`)
      : `${minutes}m`;

    return `${start} (${durationText})`;
  };
  
  // Get subject name from course ID
  const getSubjectName = () => {
    if (!state.selectedCourseId || !tutor) return "General Tutoring";
    
    const subject = tutor.subjects?.find(s => 
      (typeof s === 'string' && s === state.selectedCourseId) || 
      (typeof s === 'object' && s && 'code' in s && s.code === state.selectedCourseId)
    );
    
    if (subject) {
      return typeof subject === 'string' ? subject : 
        (subject && 'code' in subject && 'name' in subject) ? 
          `${subject.code} - ${subject.name}` : state.selectedCourseId;
    }
    
    return state.selectedCourseId;
  };
  
  // Calculate session price
  const calculatePrice = () => {
    if (!tutor || !state.selectedDuration) return "$0.00";
    
    const hourlyRate = tutor.hourlyRate || 25;
    const cost = (hourlyRate / 60) * state.selectedDuration;
    return `$${cost.toFixed(2)}`;
  };

  // Handle adding to Google Calendar
  const handleAddToGoogleCalendar = () => {
    if (!state.selectedDate || !state.selectedTimeSlot || !state.selectedTimeSlot.start || !tutor) {
      toast.error("Missing session information for calendar");
      console.error("Missing data for Google Calendar:", {
        date: state.selectedDate,
        timeSlot: state.selectedTimeSlot,
        tutor
      });
      return;
    }
    
    try {
      setAddingToCalendar(true);
      
      // Generate course info text if available
      const courseSuffix = state.selectedCourseId ? ` for ${state.selectedCourseId}` : '';
      const subject = getSubjectName();
      const isVirtual = state.sessionType === SessionType.VIRTUAL;
      const title = isVirtual ? `Tutoring Session: ${subject} (Virtual)` : `Tutoring Session with ${tutor.name}${courseSuffix}`;

      const locationText = isVirtual ? 'Virtual - Zoom Meeting' : (state.location || 'USC Campus');
      const descriptionText = isVirtual
        ? `Tutoring Session Details:\n` +
          `Course: ${subject}\n` +
          `Tutor: ${tutor.name}\n` +
          `Duration: ${state.selectedDuration} minutes\n\n` +
          `JOIN ZOOM MEETING:\n` +
          `Link will be sent to your email\n` +
          `Meeting ID: N/A\n` +
          `Password: N/A\n` +
          `Backup: Dial +1-669-900-6833, enter meeting ID\n\n` +
          `Test Zoom: https://zoom.us/test`
        : `Tutoring session with ${tutor.name}${state.selectedCourseId ? ` for course ${state.selectedCourseId}` : ''}\nDuration: ${state.selectedDuration} minutes`;
      
      // Create a valid URL for Google Calendar with details/location/attendees
      const url = generateGoogleCalendarUrl(
        tutor,
        state.selectedDate,
        state.selectedTimeSlot.start,
        state.selectedDuration,
        title,
        state.selectedCourseId,
        {
          description: descriptionText,
          location: locationText,
          attendees: state.studentEmail ? [state.studentEmail] : undefined,
        }
      );
      
      // Open in a new tab
      window.open(url, '_blank');
      
      toast.success("Opening Google Calendar");
    } catch (error) {
      console.error("Failed to add to Google Calendar:", error);
      toast.error("Failed to add to Google Calendar");
    } finally {
      setAddingToCalendar(false);
    }
  };
  
  // Handle adding to Apple Calendar
  const handleAddToAppleCalendar = () => {
    if (!state.selectedDate || !state.selectedTimeSlot || !state.selectedTimeSlot.start || !tutor) {
      toast.error("Missing session information for calendar");
      console.error("Missing data for Apple Calendar:", {
        date: state.selectedDate,
        timeSlot: state.selectedTimeSlot,
        tutor
      });
      return;
    }
    
    try {
      setAddingToCalendar(true);
      
      // Parse start time and create start/end dates
      const [hours, minutes] = state.selectedTimeSlot.start.split(':').map(Number);
      
      const startDateTime = new Date(state.selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = addMinutes(startDateTime, state.selectedDuration);
      
      // Generate course info text if available
      const courseSuffix = state.selectedCourseId ? ` for ${state.selectedCourseId}` : '';
      
      // Create ICS event data
      const isVirtual = state.sessionType === SessionType.VIRTUAL;
      const subject = getSubjectName();
      const titleForIcs = isVirtual ? `Tutoring Session: ${subject} (Virtual)` : `Tutoring Session with ${tutor.name}${courseSuffix}`;
      const locationText = isVirtual ? 'Virtual - Zoom Meeting' : (state.location || 'USC Campus');
      const descriptionText = isVirtual
        ? `Tutoring Session Details:\n` +
          `Course: ${subject}\n` +
          `Tutor: ${tutor.name}\n` +
          `Duration: ${state.selectedDuration} minutes\n\n` +
          `JOIN ZOOM MEETING:\n` +
          `Link will be sent to your email\n` +
          `Meeting ID: N/A\n` +
          `Password: N/A\n` +
          `Backup: Dial +1-669-900-6833, enter meeting ID\n\n` +
          `Test Zoom: https://zoom.us/test`
        : `Tutoring session with ${tutor.name}${state.selectedCourseId ? ` for course ${state.selectedCourseId}` : ''}`;
      const eventData: ICalEventData = {
        title: titleForIcs,
        description: descriptionText,
        location: locationText,
        startDate: startDateTime,
        endDate: endDateTime,
      };
      
      // Download the ICS file
      downloadICSFile(eventData, `tutoring-session-${format(startDateTime, 'yyyy-MM-dd')}.ics`);
      
      toast.success("Downloaded calendar file");
    } catch (error) {
      console.error("Failed to add to Apple Calendar:", error);
      toast.error("Failed to add to Apple Calendar");
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Summary</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review your session details before confirming.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">
                {state.selectedDate ? formatDate(state.selectedDate) : "Not selected"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Time & Duration</p>
              <p className="text-muted-foreground">{formatTimeSlot()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Course</p>
              <p className="text-muted-foreground">{getSubjectName()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            {state.sessionType === SessionType.VIRTUAL ? (
              <Video className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            ) : (
              <MapPin className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            )}
            <div>
              <p className="font-medium">Session Type</p>
              <p className="text-muted-foreground">
                {state.sessionType === SessionType.VIRTUAL 
                  ? "Virtual (Zoom)" 
                  : `In-person (${state.location || "Location not specified"})`}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Tutor</p>
              <p className="text-muted-foreground">{tutor?.name || "Not specified"}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between">
            <p className="font-medium">Session Price</p>
            <p className="font-bold">{calculatePrice()}</p>
          </div>
          
          {state.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="font-medium">Your Notes</p>
                <p className="text-muted-foreground mt-1">{state.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 flex items-center justify-center bg-white hover:bg-slate-50"
          onClick={handleAddToGoogleCalendar}
          disabled={addingToCalendar}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Google Calendar
        </Button>
        
        <Button
          variant="outline"
          className="flex-1 flex items-center justify-center bg-white hover:bg-slate-50"
          onClick={handleAddToAppleCalendar}
          disabled={addingToCalendar}
        >
          <Apple className="h-4 w-4 mr-2" />
          Apple Calendar
        </Button>
      </div>
    </div>
  );
}
