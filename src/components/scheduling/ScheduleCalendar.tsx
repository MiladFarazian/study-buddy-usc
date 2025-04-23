
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Session } from "@/types/session";
import { useNavigate } from "react-router-dom";
import { useTutors } from "@/hooks/useTutors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScheduleCalendarProps {
  sessions: Session[];
}

export const ScheduleCalendar = ({ sessions }: ScheduleCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { tutors, loading } = useTutors();
  
  // Get top 2 tutors by rating
  const recommendedTutors = [...tutors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  // Get calendar dates with sessions
  const calendarDates = sessions
    .filter(session => session.status !== 'cancelled')
    .map(session => ({
      date: format(new Date(session.start_time), 'yyyy-MM-dd'),
      title: session.course?.course_number || 'Tutoring Session'
    }));

  const handleViewTutorProfile = (tutorId: string) => {
    navigate(`/tutors/${tutorId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>View your schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto flex justify-center">
          <div className="min-w-[280px] w-full flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="max-w-full w-full"
            />
          </div>
        </div>
        
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
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading recommended tutors...</div>
            ) : recommendedTutors.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tutors available</div>
            ) : (
              recommendedTutors.map(tutor => (
                <div key={tutor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={tutor.imageUrl} alt={tutor.name} />
                      <AvatarFallback>
                        {tutor.firstName?.charAt(0) || tutor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{tutor.name}</p>
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          className="h-3 w-3 fill-usc-gold text-usc-gold"
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs ml-1">{tutor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewTutorProfile(tutor.id)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
