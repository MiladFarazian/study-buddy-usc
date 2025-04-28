
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tutor } from '@/types/tutor';
import { BookingSlot } from '@/lib/scheduling/types';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns'; // Added import for format function

interface BookingComponentProps {
  tutor: Tutor;
  availableSlots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  onCancel: () => void;
  loading?: boolean;
  disabled?: boolean;
  selectedCourseId?: string | null; // Add selected course ID prop
}

export function BookingComponent({
  tutor,
  availableSlots,
  onSelectSlot,
  onCancel,
  loading = false,
  disabled = false,
  selectedCourseId = null // Default to null (general session)
}: BookingComponentProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [duration, setDuration] = useState(60); // default 1 hour

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setStep(2);
  };

  // Handle time slot selection
  const handleTimeSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    setStep(3);
  };

  // Handle duration change
  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
  };

  // Handle final booking submission
  const handleBookSession = () => {
    if (selectedTimeSlot) {
      // Create a copy of the slot with additional properties
      const enhancedSlot: BookingSlot = {
        ...selectedTimeSlot,
        durationMinutes: duration,
        courseId: selectedCourseId // Add the selected course ID to the slot
      };
      
      console.log("[BookingComponent] Submitting booking with course ID:", selectedCourseId);
      onSelectSlot(enhancedSlot);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</h2>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Example date selection, you would dynamically generate these from availableSlots */}
              {Array.from(new Set(availableSlots.map(slot => 
                new Date(slot.day).toDateString()))).map((dateStr, index) => {
                const date = new Date(dateStr);
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col"
                    onClick={() => handleDateSelect(date)}
                    disabled={disabled}
                  >
                    <span className="text-sm text-muted-foreground">{format(date, 'EEE')}</span>
                    <span className="text-xl font-medium">{format(date, 'd')}</span>
                    <span className="text-xs text-muted-foreground">{format(date, 'MMM')}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Select Time: {selectedDate && formatDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableSlots
                .filter(slot => new Date(slot.day).toDateString() === selectedDate.toDateString())
                .map((slot, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-16"
                    onClick={() => handleTimeSelect(slot)}
                    disabled={disabled}
                  >
                    {formatTime(slot.start)}
                  </Button>
                ))}
            </div>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => setStep(1)}
              disabled={disabled}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && selectedDate && selectedTimeSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg">
                <p><span className="font-medium">Date:</span> {formatDate(selectedDate)}</p>
                <p><span className="font-medium">Time:</span> {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}</p>
                <p><span className="font-medium">Tutor:</span> {tutor.name}</p>
                <p><span className="font-medium">Rate:</span> ${tutor.hourlyRate || 25}/hour</p>
                {selectedCourseId && (
                  <p><span className="font-medium">Course:</span> {selectedCourseId}</p>
                )}
                {!selectedCourseId && (
                  <p><span className="font-medium">Course:</span> General Session</p>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  disabled={disabled}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleBookSession}
                  className="bg-primary text-primary-foreground"
                  disabled={disabled}
                >
                  Book Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
