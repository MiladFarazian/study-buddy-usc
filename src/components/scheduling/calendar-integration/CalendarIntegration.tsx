
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle } from "lucide-react";
import { Tutor } from "@/types/tutor";
import { downloadICSFile, ICalEventData } from '@/lib/calendar/icsGenerator';

interface CalendarIntegrationProps {
  tutor: Tutor;
  sessionDate: Date;
  sessionDuration: number;
  sessionStartTime: string;
  onClose: () => void;
}

export function CalendarIntegration({ 
  tutor, 
  sessionDate, 
  sessionDuration,
  sessionStartTime,
  onClose 
}: CalendarIntegrationProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date and time for display
  const formatDateForDisplay = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return sessionDate.toLocaleDateString('en-US', options);
  };

  // Calculate start and end times for the session
  const calculateSessionTimes = () => {
    const [hours, minutes] = sessionStartTime.split(':').map(Number);
    const startDate = new Date(sessionDate);
    startDate.setHours(hours, minutes);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + sessionDuration);
    
    return { startDate, endDate };
  };

  const addToAppleCalendar = () => {
    const { startDate, endDate } = calculateSessionTimes();

    const eventData: ICalEventData = {
      title: `Tutoring with ${tutor.name}`,
      description: `Tutoring session with ${tutor.name} for ${sessionDuration} minutes.`,
      location: 'USC Campus',
      startDate: startDate,
      endDate: endDate
    };

    downloadICSFile(eventData);
    setAddedToCalendar(true);
  };

  // Format time for display
  const formatTimeForDisplay = () => {
    const { startDate, endDate } = calculateSessionTimes();
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${startDate.toLocaleTimeString('en-US', timeOptions)} - ${endDate.toLocaleTimeString('en-US', timeOptions)}`;
  };

  if (addedToCalendar) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-4">
            <div className="bg-green-50 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle>Added to Calendar</CardTitle>
          <CardDescription>
            Your tutoring session has been added to your calendar.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2">
          <Button onClick={onClose} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
            Done
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-50 p-3 rounded-full">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle>Add to Calendar</CardTitle>
        <CardDescription>
          Would you like to add this tutoring session to your calendar?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 p-4 rounded-md mb-6">
          <div className="grid gap-2">
            <div className="flex items-center">
              <span className="font-medium">Session with:</span>
              <span className="ml-2">{tutor.name}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Date:</span>
              <span className="ml-2">{formatDateForDisplay()}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Time:</span>
              <span className="ml-2">{formatTimeForDisplay()}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Duration:</span>
              <span className="ml-2">{sessionDuration} minutes</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={addToAppleCalendar}
            className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path 
                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 8.42 7.31c1.33.07 2.25.79 3.04.84 1.15-.17 2.23-.88 3.47-.84 1.53.17 2.68.87 3.4 2.23-3.03 1.86-2.32 6.15.72 7.66-.65 1.44-1.47 2.87-3 4.08zM13 3.76c.81-1.02 1.42-2.46 1.18-4-1.24.06-2.66.88-3.5 1.82-.74.83-1.35 2.31-1.12 3.64 1.35.05 2.62-.75 3.44-1.46z" 
                fill="currentColor" 
              />
            </svg>
            Add to Apple Calendar
          </Button>

          <Button 
            onClick={() => window.open(generateGoogleCalendarLink(), '_blank')}
            className="w-full flex items-center justify-center bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path 
                d="M21.56 2.6c.15.28.22.57.22.9v17c0 .33-.07.62-.22.9s-.36.48-.64.64-.57.22-.9.22H3.87c-.33 0-.63-.07-.9-.22s-.48-.36-.64-.64-.22-.57-.22-.9V3.5c0-.33.07-.62.22-.9s.36-.48.64-.64.57-.22.9-.22H6v1.5H4v17h16.01v-17H18v-1.5h2.65c.33 0 .63.07.9.22s.48.36.64.64zM10.5 7V.5h3v6.5c0 .28-.1.52-.29.71s-.43.29-.71.29h-1c-.28 0-.52-.1-.71-.29s-.29-.43-.29-.71zm12-5v17c0 .55-.2 1.02-.59 1.41s-.86.59-1.41.59H3.87c-.55 0-1.02-.2-1.41-.59s-.59-.86-.59-1.41V3.5c0-.55.2-1.02.59-1.41S3.32 1.5 3.87 1.5h5.13v5.5c0 .55.2 1.02.59 1.41s.86.59 1.41.59h1c.55 0 1.02-.2 1.41-.59s.59-.86.59-1.41V1.5h5.13c.55 0 1.02.2 1.41.59s.59.86.59 1.41z" 
                fill="currentColor" 
              />
            </svg>
            Add to Google Calendar
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          variant="link" 
          onClick={onClose}
          className="text-muted-foreground"
        >
          Skip
        </Button>
      </CardFooter>
    </Card>
  );
}

