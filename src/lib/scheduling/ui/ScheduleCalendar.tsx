
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Session } from "@/types/session";
import { format, isSameDay } from 'date-fns';

interface ScheduleCalendarProps {
  sessions: Session[];
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ sessions }) => {
  // Get the dates that have sessions
  const sessionDates = sessions.map(session => 
    session.start_time ? new Date(session.start_time) : null
  ).filter(Boolean) as Date[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={new Date()}
          className="rounded-md border"
          modifiers={{
            booked: sessionDates
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontWeight: 'bold'
            }
          }}
          components={{
            DayContent: ({ date }) => {
              const hasSession = sessionDates.some(sessionDate => 
                sessionDate && isSameDay(date, sessionDate)
              );

              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  {date.getDate()}
                  {hasSession && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-usc-cardinal rounded-full" />
                  )}
                </div>
              );
            }
          }}
        />
      </CardContent>
    </Card>
  );
};
