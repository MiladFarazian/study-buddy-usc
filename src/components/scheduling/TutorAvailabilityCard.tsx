import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, addDays, isSameDay, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { getTutorAvailability } from "@/lib/scheduling";

interface TutorAvailabilityCardProps {
  tutorId?: string;
  readOnly?: boolean;
}

export const TutorAvailabilityCard = ({ tutorId, readOnly = false }: TutorAvailabilityCardProps) => {
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  useEffect(() => {
    const loadAvailability = async () => {
      if (!tutorId) return;
      
      const loadedAvailability = await getTutorAvailability(tutorId);
      if (loadedAvailability) {
        setAvailability(loadedAvailability);
      }
    };

    loadAvailability();
  }, [tutorId]);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
        <CardDescription>View the tutor's availability for the week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2>{format(weekStart, 'MMMM dd, yyyy')} - {format(addDays(weekStart, 6), 'MMMM dd, yyyy')}</h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const currentDate = addDays(weekStart, index);
            const formattedDate = format(currentDate, 'yyyy-MM-dd');
            const dayKey = day.toLowerCase();
            const slots = availability[dayKey] || [];

            return (
              <div key={day} className="text-center">
                <p className="font-semibold">{day.substring(0, 3)}</p>
                <div
                  className={cn(
                    "rounded-md border p-2 w-full",
                    isSameDay(currentDate, new Date()) ? "bg-usc-cardinal text-white" : "bg-secondary",
                    slots.length > 0 ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  {slots.length > 0 ? (
                    slots.map((slot, slotIndex) => (
                      <p key={slotIndex} className="text-sm">
                        {slot.start} - {slot.end}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm">No slots</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
