import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { getTutorAvailability } from "@/lib/scheduling";
import { WeeklyAvailabilityCalendar } from './calendar';
import { WeeklyAvailability } from "@/lib/scheduling/types";
import { Loader2 } from "lucide-react";
import { format, addDays } from 'date-fns';

interface TutorAvailabilityCardProps {
  tutorId: string;
  readOnly?: boolean;
  onSelectTimeSlot?: (date: Date, startTime: string, endTime: string) => void;
}

export const TutorAvailabilityCard: React.FC<TutorAvailabilityCardProps> = ({
  tutorId,
  readOnly = true,
  onSelectTimeSlot
}) => {
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      setError(null);
      
      try {
        const tutorAvailability = await getTutorAvailability(tutorId);
        setAvailability(tutorAvailability);
        
        if (!tutorAvailability) {
          setError("Could not load tutor's availability.");
        }
      } catch (err) {
        console.error("Error loading tutor availability:", err);
        setError("Failed to load availability. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    if (tutorId) {
      loadAvailability();
    }
  }, [tutorId]);

  const handleAvailabilityChange = (newAvailability: WeeklyAvailability) => {
    setAvailability(newAvailability);
    
    // If onSelectTimeSlot is provided, find the first available slot and call it
    if (onSelectTimeSlot) {
      // Find the first day with availability
      const today = new Date();
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check the next 7 days
      for (let i = 0; i < 7; i++) {
        const checkDate = addDays(today, i);
        const dayName = weekDays[checkDate.getDay()];
        const daySlots = newAvailability[dayName] || [];
        
        if (daySlots.length > 0) {
          // Found a day with availability, use the first slot
          const firstSlot = daySlots[0];
          onSelectTimeSlot(checkDate, firstSlot.start, firstSlot.end);
          break;
        }
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading availability...</span>
      </Card>
    );
  }

  if (error || !availability) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">{error || "No availability information found."}</p>
        </div>
      </Card>
    );
  }

  return (
    <WeeklyAvailabilityCalendar
      availability={availability}
      onChange={handleAvailabilityChange}
      readOnly={readOnly}
    />
  );
};
