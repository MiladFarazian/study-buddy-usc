
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { format, addMinutes } from "date-fns";
import { CalendarDays, CheckCircle, Apple } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { generateGoogleCalendarUrl } from "@/lib/calendar/googleCalendarUtils";
import { ICalEventData, downloadICSFile } from "@/lib/calendar/icsGenerator";

interface CalendarIntegrationProps {
  tutor: Tutor;
  sessionDate: Date;
  sessionStartTime: string; // Format: "HH:MM"
  sessionDuration: number;
  courseId?: string | null;
  courseName?: string | null;
  onClose: () => void;
}

export function CalendarIntegration({ 
  tutor, 
  sessionDate, 
  sessionStartTime,
  sessionDuration,
  courseId,
  courseName,
  onClose 
}: CalendarIntegrationProps) {
  const courseSuffix = courseId ? ` for ${courseName || courseId}` : '';
  
  // Format the session date with the time
  const [hours, minutes] = sessionStartTime.split(':').map(Number);
  
  const startDateTime = new Date(sessionDate);
  startDateTime.setHours(hours, minutes, 0, 0);
  
  const endDateTime = addMinutes(startDateTime, sessionDuration);
  
  // Generate a title that includes the course if available
  const eventTitle = `Tutoring Session with ${tutor.name}${courseSuffix}`;
  
  const handleAddToGoogleCalendar = () => {
    try {
      // Generate Google Calendar URL
      const url = generateGoogleCalendarUrl(
        tutor, 
        sessionDate, 
        sessionStartTime, 
        sessionDuration, 
        eventTitle, 
        courseId
      );
      
      // Log the URL for debugging
      console.log("Google Calendar URL:", url);
      
      // Open in a new window
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error adding to Google Calendar:", error);
    }
  };
  
  const handleAddToAppleCalendar = () => {
    try {
      // Create event data for Apple Calendar
      const eventData: ICalEventData = {
        title: eventTitle,
        description: `Tutoring session with ${tutor.name}${courseId ? ` for course ${courseId}` : ''}`,
        location: "USC Campus",
        startDate: startDateTime,
        endDate: endDateTime,
      };
      
      // Log the event data for debugging
      console.log("Apple Calendar event data:", eventData);
      
      // Download the ICS file
      downloadICSFile(eventData, `tutoring-session-${format(startDateTime, 'yyyy-MM-dd')}.ics`);
    } catch (error) {
      console.error("Error adding to Apple Calendar:", error);
    }
  };
  
  // Format the session date and time for display
  const formattedDate = format(sessionDate, "EEEE, MMMM d, yyyy");
  
  // Convert 24-hour time to 12-hour time with AM/PM
  const formattedTime = () => {
    const [hours, minutes] = sessionStartTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, "h:mm a");
  };
  
  // Calculate end time
  const endTime = () => {
    const [hours, minutes] = sessionStartTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    const endDate = addMinutes(date, sessionDuration);
    return format(endDate, "h:mm a");
  };

  return (
    <Card className="border-green-100 bg-green-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-center text-green-600 mb-2">
          <CheckCircle className="h-10 w-10" />
        </div>
        <CardTitle className="text-center">Booking Confirmed!</CardTitle>
        <CardDescription className="text-center">
          Your session has been successfully scheduled.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-white rounded-md border p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tutor:</span>
            <span className="font-medium">{tutor.name}</span>
          </div>
          
          {courseId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course:</span>
              <span className="font-medium">{courseName || courseId}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{formattedTime()} - {endTime()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{sessionDuration} minutes</span>
          </div>
        </div>
        
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground mb-3">
            Would you like to add this session to your calendar?
          </p>
          
          <Button
            variant="outline"
            className="w-full mb-2 border-green-600 text-green-600 hover:bg-green-50"
            onClick={handleAddToGoogleCalendar}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Add to Google Calendar
          </Button>
          
          <Button
            variant="outline"
            className="w-full mb-2 border-green-600 text-green-600 hover:bg-green-50"
            onClick={handleAddToAppleCalendar}
          >
            <Apple className="mr-2 h-4 w-4" />
            Add to Apple Calendar
          </Button>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={onClose}
        >
          Done
        </Button>
      </CardFooter>
    </Card>
  );
}
