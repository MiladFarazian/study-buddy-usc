
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { Calendar, Clock, User, MapPin, DollarSign } from 'lucide-react';

export interface BookingSummaryProps {
  tutorName: string;
  date: Date | null;
  startTime: string | null;
  duration: number | null;
  location?: string;
  cost: number;
  className?: string;
}

export function BookingSummary({
  tutorName,
  date,
  startTime,
  duration,
  location,
  cost,
  className = ''
}: BookingSummaryProps) {
  // Calculate end time based on start time and duration
  const getEndTime = () => {
    if (!startTime || !duration) return null;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  // Format time for display (e.g., "14:30" -> "2:30 PM")
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const endTime = getEndTime();

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-lg font-medium mb-2">Booking Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{tutorName}</span>
          </div>
          
          {date && (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
          )}
          
          {startTime && endTime && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{formatTimeDisplay(startTime)} - {formatTimeDisplay(endTime)}</span>
            </div>
          )}
          
          {location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{location}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm font-medium">
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>${cost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
