
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Session } from "@/types/session";
import { format } from 'date-fns';

interface ScheduleCalendarProps {
  sessions: Session[];
}

export function ScheduleCalendar({ sessions }: ScheduleCalendarProps) {
  // Function to highlight dates with sessions
  const sessionsDateClass = (date: Date): string => {
    const hasSession = sessions.some(session => {
      const sessionDate = new Date(session.start_time); // Changed from startTime to start_time
      return (
        date.getDate() === sessionDate.getDate() &&
        date.getMonth() === sessionDate.getMonth() &&
        date.getFullYear() === sessionDate.getFullYear()
      );
    });

    return hasSession ? 'bg-usc-cardinal/10 text-usc-cardinal font-bold' : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Overview of your scheduled sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar 
          mode="single"
          disabled={date => 
            date < new Date(new Date().setHours(0, 0, 0, 0))
          }
          modifiersClassNames={{
            selected: 'bg-usc-cardinal text-white',
          }}
          modifiersStyles={{
            selected: { backgroundColor: '#990000' }
          }}
          className="rounded-md border"
          classNames={{
            day_today: "bg-muted font-bold text-usc-cardinal",
            day_selected: "bg-usc-cardinal text-primary-foreground hover:bg-usc-cardinal/90 focus:bg-usc-cardinal/90",
            day: function(date) { 
              return sessionsDateClass(date);
            }, // Fixed by using a function return
          }}
        />
      </CardContent>
    </Card>
  );
};
