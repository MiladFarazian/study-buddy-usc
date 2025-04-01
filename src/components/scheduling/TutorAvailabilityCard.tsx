
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { getTutorAvailability } from "@/lib/scheduling";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface TutorAvailabilityCardProps {
  tutorId?: string;
  readOnly?: boolean;
  onSelectTimeSlot?: (date: Date, startTime: string, endTime: string) => void;
}

export const TutorAvailabilityCard = ({ 
  tutorId, 
  readOnly = false,
  onSelectTimeSlot
}: TutorAvailabilityCardProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!tutorId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const loadedAvailability = await getTutorAvailability(tutorId);
        if (loadedAvailability) {
          setAvailability(loadedAvailability);
        }
      } catch (error) {
        console.error("Error loading tutor availability:", error);
        toast({
          title: "Error",
          description: "Failed to load tutor's availability.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [tutorId, toast]);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  // Generate hours for the grid (8 AM to 9 PM)
  const hours = Array.from({ length: 14 }, (_, i) => i + 8);
  
  // Generate days of the week starting from Monday
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekDays = days.map((day, i) => ({
    name: day,
    date: addDays(weekStart, i),
    key: day.toLowerCase()
  }));

  const handleCellClick = (day: Date, hour: number) => {
    if (!onSelectTimeSlot || readOnly) return;
    
    const dayKey = days[day.getDay() === 0 ? 6 : day.getDay() - 1].toLowerCase();
    const daySlots = availability[dayKey] || [];
    
    // Find a slot that contains this hour
    for (const slot of daySlots) {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);
      
      if (hour >= startHour && hour < endHour) {
        // This slot contains the selected hour
        const cellId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
        setSelectedCell(cellId);
        
        // Call the callback with a full hour slot
        onSelectTimeSlot(day, `${hour}:00`, `${hour + 1}:00`);
        return;
      }
    }
  };

  // Check if a specific hour on a specific day is available
  const isTimeAvailable = (day: string, hour: number) => {
    const daySlots = availability[day] || [];
    
    return daySlots.some(slot => {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  };

  // Check if a cell is selected
  const isCellSelected = (day: Date, hour: number) => {
    const cellId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
    return cellId === selectedCell;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>Loading tutor's availability...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Availability</CardTitle>
            <CardDescription>View when the tutor is available for sessions</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="w-full min-w-[700px]">
          {/* Header row with dates */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
            <div className="p-2 border-b border-r font-medium text-center">
              Time
            </div>
            {weekDays.map((day) => (
              <div key={day.key} className="p-2 border-b border-r text-center">
                <div className="font-medium">{day.name.substring(0, 3)}</div>
                <div className="text-xs text-muted-foreground">
                  {format(day.date, 'MMM d')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)]">
              <div className="p-2 border-b border-r text-center text-sm text-muted-foreground">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </div>
              {weekDays.map((day) => {
                const isAvailable = isTimeAvailable(day.key, hour);
                const isSelected = isCellSelected(day.date, hour);
                return (
                  <div
                    key={`${day.key}-${hour}`}
                    className={cn(
                      "p-2 border-b border-r h-10 transition-colors",
                      isAvailable && !isSelected && !readOnly && "bg-usc-cardinal/70 hover:bg-usc-cardinal cursor-pointer",
                      isAvailable && readOnly && "bg-usc-cardinal/90",
                      isSelected && "bg-usc-gold text-gray-900",
                      !isAvailable && "bg-gray-100"
                    )}
                    onClick={() => isAvailable && handleCellClick(day.date, hour)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {readOnly 
              ? "Colored cells show when the tutor is available" 
              : "Click on available time slots to book a session"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
