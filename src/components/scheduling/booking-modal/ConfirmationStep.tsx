
import { useState } from "react";
import { useScheduling } from "@/contexts/SchedulingContext";
import { formatDate, formatTime } from "@/lib/scheduling/time-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, BookOpen, MapPin, Video, User, Download, Check } from "lucide-react";
import { SessionType } from "@/contexts/SchedulingContext";
import { toast } from "sonner";
import { format } from "date-fns";

export function ConfirmationStep() {
  const { state, tutor } = useScheduling();
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  // Format selected time
  const formatTimeSlot = () => {
    if (!state.selectedTimeSlot) return "No time selected";
    
    const start = formatTime(state.selectedTimeSlot.start);
    return `${start} (${state.selectedDuration} minutes)`;
  };
  
  // Get subject name from course ID
  const getSubjectName = () => {
    if (!state.selectedCourseId || !tutor) return "General Tutoring";
    
    const subject = tutor.subjects.find(s => s.code === state.selectedCourseId);
    return subject ? `${subject.code} - ${subject.name}` : state.selectedCourseId;
  };
  
  // Calculate session price
  const calculatePrice = () => {
    if (!tutor || !state.selectedDuration) return "$0.00";
    
    const hourlyRate = tutor.hourlyRate || 25;
    const cost = (hourlyRate / 60) * state.selectedDuration;
    return `$${cost.toFixed(2)}`;
  };
  
  // Handle adding to calendar
  const handleAddToCalendar = async () => {
    try {
      setAddingToCalendar(true);
      
      // Simulate calendar download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Event added to calendar");
      setAddingToCalendar(false);
    } catch (error) {
      console.error("Failed to add to calendar:", error);
      toast.error("Failed to add event to calendar");
      setAddingToCalendar(false);
    }
  };
  
  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    try {
      // This would integrate with backend in a real implementation
      setBookingComplete(true);
      toast.success("Your session has been booked!");
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to book session");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Session Summary</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review your session details before confirming.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">
                {state.selectedDate ? formatDate(state.selectedDate) : "Not selected"}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Time & Duration</p>
              <p className="text-muted-foreground">{formatTimeSlot()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Course</p>
              <p className="text-muted-foreground">{getSubjectName()}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            {state.sessionType === SessionType.VIRTUAL ? (
              <Video className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            ) : (
              <MapPin className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            )}
            <div>
              <p className="font-medium">Session Type</p>
              <p className="text-muted-foreground">
                {state.sessionType === SessionType.VIRTUAL 
                  ? "Virtual (Zoom)" 
                  : `In-person (${state.location || "Location not specified"})`}
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 mr-3 mt-0.5 text-usc-cardinal" />
            <div>
              <p className="font-medium">Tutor</p>
              <p className="text-muted-foreground">{tutor?.name || "Not specified"}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between">
            <p className="font-medium">Session Price</p>
            <p className="font-bold">{calculatePrice()}</p>
          </div>
          
          {state.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="font-medium">Your Notes</p>
                <p className="text-muted-foreground mt-1">{state.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Button
        variant="outline"
        className="w-full flex items-center justify-center"
        disabled={addingToCalendar || bookingComplete}
        onClick={handleAddToCalendar}
      >
        {addingToCalendar ? (
          <>
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Adding to calendar...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Add to Calendar
          </>
        )}
      </Button>
    </div>
  );
}
