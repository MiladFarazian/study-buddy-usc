
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Star, ArrowRight } from "lucide-react";
import { Session } from "@/types/session";

interface ScheduleCalendarProps {
  sessions: Session[];
}

export const ScheduleCalendar = ({ sessions }: ScheduleCalendarProps) => {
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
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Recommended Tutors</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sarah Chen</p>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                    <span className="text-xs ml-1">4.9</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mike Johnson</p>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-usc-gold text-usc-gold" />
                    <span className="text-xs ml-1">4.7</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
