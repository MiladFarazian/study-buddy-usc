
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScheduling } from '@/contexts/SchedulingContext';
import { CheckCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatTimeDisplay } from '@/lib/scheduling/time-utils';
import { useNavigate } from 'react-router-dom';

interface ConfirmationStepProps {
  onClose: () => void;
}

export function ConfirmationStep({ onClose }: ConfirmationStepProps) {
  const { state, dispatch, tutor } = useScheduling();
  const navigate = useNavigate();
  
  if (!state.selectedTimeSlot || !state.selectedDate || !tutor) return null;
  
  // Calculate end time based on duration
  const { start: startTime } = state.selectedTimeSlot;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + state.selectedDuration;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  // Format the selected time for display
  const formattedDate = format(state.selectedDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = formatTimeDisplay(startTime);
  const formattedEndTime = formatTimeDisplay(endTime);
  
  const handleViewSchedule = () => {
    navigate('/schedule');
    onClose();
  };
  
  const handleBookAnother = () => {
    dispatch({ type: 'RESET' });
    onClose();
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
            <h2 className="text-2xl font-semibold">Booking Confirmed!</h2>
            <p className="text-muted-foreground">
              Your session with {tutor.name} has been successfully booked.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg text-left">
            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">
                    {formattedStartTime} - {formattedEndTime} ({(state.selectedDuration / 60).toFixed(1)} hours)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleViewSchedule}
              className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
            >
              View My Schedule
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBookAnother}
              className="w-full"
            >
              Book Another Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
