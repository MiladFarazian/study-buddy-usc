
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Star, ArrowRight } from "lucide-react";
import { Session } from "@/types/session";

interface ScheduleCalendarProps {
  sessions: Session[];
}

export function ScheduleCalendar({ sessions }: ScheduleCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Get calendar dates with sessions
  const calendarDates = sessions
    .filter(session => session.status !== 'cancelled')
    .map(session => ({
      date: format(new Date(session.start_time), 'yyyy-MM-dd'),
      title: session.course?.course_number || 'Tutoring Session'
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>View your schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        {calendarDates.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Upcoming Sessions:</p>
            <div className="space-y-2">
              {calendarDates
                .filter((value, index, self) => index === self.findIndex(t => t.date === value.date))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 5)
                .map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-usc-cardinal rounded-full"></div>
                    <span>{format(new Date(item.date), 'MMM d')} - {item.title}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
