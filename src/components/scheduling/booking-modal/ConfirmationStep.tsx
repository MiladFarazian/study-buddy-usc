
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { formatDate, formatTime } from "@/lib/scheduling/time-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, BookOpen, MapPin, Video, User, Download, Check, ArrowLeft } from "lucide-react";
import { SessionType } from "@/contexts/SchedulingContext";
import { toast } from "sonner";
import { format, addMinutes, parseISO } from "date-fns";
import { generateGoogleCalendarUrl } from "@/lib/calendar/googleCalendarUtils";
import { ICalEventData, downloadICSFile } from "@/lib/calendar/icsGenerator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Apple } from "lucide-react";

export function ConfirmationStep() {
  const { state, tutor } = useScheduling();
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  // Format selected time
  const formatTimeSlot = () => {
    if (!state.selectedTimeSlot) return "No time selected";
    
    const start = formatTime(state.selectedTimeSlot.start);
    return `${start} (${state.selectedDuration} minutes)`;
  };
  
  // Get subject name from course ID
  const getSubjectName = () => {
    if (!state.selectedCourseId || !tutor) return "General Tutoring";
    
    const subject = tutor.subjects.find(s => s.code === state.selectedCourseId);
    return subject ? `${subject.code} - ${subject.name}` : state.selectedCourseId;
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
    if (!state.selectedDate || !state.selectedTimeSlot || !tutor) return;
    
    try {
      setAddingToCalendar(true);
      
      // Generate course info text if available
      const courseSuffix = state.selectedCourseId ? ` for ${state.selectedCourseId}` : '';
      const title = `Tutoring Session with ${tutor.name}${courseSuffix}`;
      
      // Generate the Google Calendar URL
      const url = generateGoogleCalendarUrl(
        tutor,
        state.selectedDate,
        state.selectedTimeSlot.start,
        state.selectedDuration,
        title,
        state.selectedCourseId
      );
      
      // Open in a new tab
      window.open(url, '_blank');
      
      toast.success("Added to Google Calendar");
    } catch (error) {
      console.error("Failed to add to Google Calendar:", error);
      toast.error("Failed to add to Google Calendar");
    } finally {
      setAddingToCalendar(false);
      setCalendarMenuOpen(false);
    }
  };
  
  // Handle adding to Apple Calendar
  const handleAddToAppleCalendar = () => {
    if (!state.selectedDate || !state.selectedTimeSlot || !tutor) return;
    
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
      const eventData: ICalEventData = {
        title: `Tutoring Session with ${tutor.name}${courseSuffix}`,
        description: `Tutoring session with ${tutor.name}${state.selectedCourseId ? ` for course ${state.selectedCourseId}` : ''}`,
        location: state.sessionType === SessionType.VIRTUAL ? 'Virtual (Zoom)' : (state.location || 'USC Campus'),
        startDate: startDateTime,
        endDate: endDateTime,
      };
      
      // Download the ICS file
      downloadICSFile(eventData, `tutoring-session-${format(startDateTime, 'yyyy-MM-dd')}.ics`);
      
      toast.success("Added to Apple Calendar");
    } catch (error) {
      console.error("Failed to add to Apple Calendar:", error);
      toast.error("Failed to add to Apple Calendar");
    } finally {
      setAddingToCalendar(false);
      setCalendarMenuOpen(false);
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
            <Calendar className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
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
      
      <div className="flex flex-col gap-3">
        <Popover open={calendarMenuOpen} onOpenChange={setCalendarMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              disabled={addingToCalendar || bookingComplete}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-48">
            <div className="flex flex-col gap-1">
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={handleAddToGoogleCalendar}
                disabled={addingToCalendar}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Google Calendar
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={handleAddToAppleCalendar}
                disabled={addingToCalendar}
              >
                <Apple className="h-4 w-4 mr-2" />
                Apple Calendar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
