
import { useState } from 'react';
import { format, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookingSlot } from "@/lib/scheduling";
import { Tutor } from "@/types/tutor";
import { Calendar as CalendarIcon, Clock, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { convertTimeToMinutes, convertMinutesToTime, formatTimeDisplay } from '@/lib/scheduling/time-utils';

interface BookingComponentProps {
  tutor: Tutor;
  availableSlots: BookingSlot[];
  onSelectSlot: (slot: BookingSlot) => void;
  onCancel: () => void;
  loading?: boolean;
}

type BookingStep = 'date' | 'time' | 'duration';

export function BookingComponent({ 
  tutor, 
  availableSlots, 
  onSelectSlot, 
  onCancel,
  loading = false 
}: BookingComponentProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<BookingSlot | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(60); // Default 60 minutes
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [availableStartTimes, setAvailableStartTimes] = useState<string[]>([]);
  
  // Filter available slots for the selected date
  const availableTimeSlotsForDate = availableSlots.filter(slot => {
    if (!selectedDate) return false;
    const slotDate = new Date(slot.day);
    return slotDate.toDateString() === selectedDate.toDateString() && slot.available;
  });

  // Helper to get dates that have available slots
  const datesWithSlots = () => {
    const dates = new Set<string>();
    availableSlots.forEach(slot => {
      if (slot.available) {
        dates.add(format(slot.day, 'yyyy-MM-dd'));
      }
    });
    return Array.from(dates).map(dateStr => parseISO(dateStr));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep('time');
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot: BookingSlot) => {
    setSelectedTimeSlot(slot);
    
    // Generate available start times in 15-minute increments
    const startTimeMinutes = convertTimeToMinutes(slot.start);
    const endTimeMinutes = convertTimeToMinutes(slot.end);
    const maxDuration = endTimeMinutes - startTimeMinutes;
    
    const startTimes: string[] = [];
    // Generate start times in 15-minute increments, leaving at least 15 minutes for session
    for (let time = startTimeMinutes; time < endTimeMinutes - 15; time += 15) {
      startTimes.push(convertMinutesToTime(time));
    }
    
    setAvailableStartTimes(startTimes);
    
    // Set default start time to the beginning of the slot
    const defaultStartTime = slot.start;
    setSelectedStartTime(defaultStartTime);
    setSessionStart(defaultStartTime);
    
    // Set default duration to 60 minutes or max available time if less
    const defaultDuration = Math.min(60, maxDuration);
    setSessionDuration(defaultDuration);
    
    // Calculate cost based on duration
    calculateCost(defaultDuration, tutor.hourlyRate || 25);
    
    setStep('duration');
  };

  // Handle start time selection
  const handleStartTimeChange = (startTime: string) => {
    setSelectedStartTime(startTime);
    setSessionStart(startTime);
    
    // Adjust max duration based on new start time
    if (selectedTimeSlot) {
      const startTimeMinutes = convertTimeToMinutes(startTime);
      const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
      const maxPossibleDuration = endTimeMinutes - startTimeMinutes;
      
      // If current duration exceeds max possible, adjust it
      if (sessionDuration > maxPossibleDuration) {
        setSessionDuration(maxPossibleDuration);
        calculateCost(maxPossibleDuration, tutor.hourlyRate || 25);
      } else {
        // Recalculate session time range and cost with new start time
        calculateCost(sessionDuration, tutor.hourlyRate || 25);
      }
    }
  };

  // Calculate the cost based on duration and hourly rate
  const calculateCost = (durationMinutes: number, hourlyRate: number) => {
    const durationHours = durationMinutes / 60;
    const cost = hourlyRate * durationHours;
    setCalculatedCost(cost);
  };

  // Handle duration slider change
  const handleDurationChange = (value: number[]) => {
    if (!selectedTimeSlot || !value.length || !sessionStart) return;
    
    const newDuration = value[0];
    setSessionDuration(newDuration);
    
    // Calculate cost based on new duration
    calculateCost(newDuration, tutor.hourlyRate || 25);
  };

  // Get the maximum possible duration for the selected time slot and start time
  const getMaxDuration = (): number => {
    if (!selectedTimeSlot || !sessionStart) return 180; // Default max 3 hours
    
    const startTimeMinutes = convertTimeToMinutes(sessionStart);
    const endTimeMinutes = convertTimeToMinutes(selectedTimeSlot.end);
    
    // Cap at 3 hours or max available
    return Math.min(180, endTimeMinutes - startTimeMinutes);
  };

  // Format time for displaying the session start and end times
  const getSessionTimeRange = (): string => {
    if (!sessionStart || !sessionDuration || !selectedTimeSlot) return '';
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return `${formatTimeDisplay(sessionStart)} - ${formatTimeDisplay(endTime)}`;
  };

  // Function to get the final booking slot based on selected duration
  const getFinalBookingSlot = (): BookingSlot | null => {
    if (!selectedTimeSlot || !sessionStart || !sessionDuration) return null;
    
    const startMinutes = convertTimeToMinutes(sessionStart);
    const endMinutes = startMinutes + sessionDuration;
    const endTime = convertMinutesToTime(endMinutes);
    
    return {
      tutorId: tutor.id,
      day: selectedTimeSlot.day,
      start: sessionStart,
      end: endTime,
      available: true
    };
  };

  // Handle confirming the session booking
  const handleConfirmBooking = () => {
    const bookingSlot = getFinalBookingSlot();
    if (bookingSlot) {
      onSelectSlot(bookingSlot);
    } else {
      toast({
        title: "Error",
        description: "Unable to create booking with selected information.",
        variant: "destructive",
      });
    }
  };

  // Handle back button
  const handleBack = () => {
    switch (step) {
      case 'time':
        setStep('date');
        break;
      case 'duration':
        setStep('time');
        break;
      default:
        onCancel();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-usc-cardinal"></div>
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 'date' ? "Cancel" : "Back"}
          </Button>
        </div>

        {/* Step 1: Date Selection */}
        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Select a Date</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(date) => {
                    // Disable dates that don't have available slots
                    return !datesWithSlots().some(d => d.toDateString() === date.toDateString());
                  }}
                />
              </PopoverContent>
            </Popover>
            
            {selectedDate && (
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => setStep('time')}
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Time Block Selection */}
        {step === 'time' && selectedDate && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Select Available Time Block</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {availableTimeSlotsForDate.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 border rounded-md bg-muted/30">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">
                    No available time slots for this date. Please select another date.
                  </p>
                </div>
              ) : (
                availableTimeSlotsForDate.map((slot, index) => {
                  const startTime = parseISO(`2000-01-01T${slot.start}`);
                  const endTime = parseISO(`2000-01-01T${slot.end}`);
                  const durationMins = differenceInMinutes(endTime, startTime);
                  const durationHours = durationMins / 60;
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={cn(
                        "h-auto p-4 justify-start flex-col items-start text-left",
                        selectedTimeSlot === slot && "border-usc-cardinal bg-red-50"
                      )}
                      onClick={() => handleTimeSlotSelect(slot)}
                    >
                      <div className="flex flex-col w-full">
                        <span className="text-base font-medium">
                          {formatTimeDisplay(slot.start)} - {formatTimeDisplay(slot.end)}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">
                          {durationHours.toFixed(1)} hours available
                        </span>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
            
            {availableTimeSlotsForDate.length > 0 && (
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep('date')}>
                  Back
                </Button>
                <Button 
                  onClick={() => selectedTimeSlot && setStep('duration')}
                  disabled={!selectedTimeSlot}
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Duration Selection */}
        {step === 'duration' && selectedTimeSlot && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Choose Session Duration</h2>
            
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="mb-4">
                <Label className="text-sm mb-1">Start Time</Label>
                <Select value={selectedStartTime} onValueChange={handleStartTimeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStartTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTimeDisplay(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{getSessionTimeRange()}</span>
                {calculatedCost !== null && (
                  <span className="font-bold text-usc-cardinal">${calculatedCost.toFixed(2)}</span>
                )}
              </div>
              
              <Slider
                defaultValue={[sessionDuration]}
                min={15}
                max={getMaxDuration()}
                step={15}
                value={[sessionDuration]}
                onValueChange={handleDurationChange}
                className="my-4"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>15 min</span>
                <span>{(getMaxDuration() / 60).toFixed(1)} hours</span>
              </div>
              
              <div className="flex justify-between items-center text-sm mt-4">
                <span>Duration: {(sessionDuration / 60).toFixed(1)} hours</span>
                <span>Rate: ${tutor.hourlyRate?.toFixed(2) || "25.00"}/hour</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep('time')}>
                Back
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
