
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { getTutorAvailability } from '@/lib/scheduling-utils';
import { WeeklyAvailability } from '@/types/scheduling';
import { Loader2 } from 'lucide-react';

interface TutorAvailabilityCardProps {
  tutorId: string | undefined;
  readOnly: boolean;
}

export const TutorAvailabilityCard: React.FC<TutorAvailabilityCardProps> = ({ 
  tutorId, 
  readOnly 
}) => {
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);

  useEffect(() => {
    if (tutorId) {
      loadAvailability();
    }
  }, [tutorId]);

  const loadAvailability = async () => {
    if (!tutorId) return;
    
    setLoading(true);
    try {
      const data = await getTutorAvailability(tutorId);
      setAvailability(data);
    } catch (error) {
      console.error("Error loading availability:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time 
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    } catch (e) {
      return time;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            No availability information found.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there's any availability set
  const hasAvailability = Object.values(availability).some(slots => 
    Array.isArray(slots) && slots.length > 0
  );

  if (!hasAvailability) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            {readOnly ? 
              "This tutor has not set their availability yet." :
              "You haven't set your availability yet."
            }
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
            const daySlots = availability[day] || [];
            return (
              <div key={day} className="border rounded-md overflow-hidden">
                <div className="bg-muted px-3 py-2 font-medium capitalize">
                  {day}
                </div>
                <div className="p-3">
                  {daySlots.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Not available
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {daySlots.map((slot, index) => (
                        <li key={index} className="text-sm">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </li>
                      ))}
                    </ul>
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
