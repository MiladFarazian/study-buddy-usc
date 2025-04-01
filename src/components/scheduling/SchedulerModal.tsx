
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Calendar, Clock, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { format, addMinutes, parseISO } from "date-fns";
import { Tutor } from "@/types/tutor";
import { supabase } from "@/integrations/supabase/client";
import { createSessionBooking, createPaymentTransaction } from "@/lib/scheduling";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
}

type SchedulingStep = "date" | "time" | "duration" | "payment" | "confirmation";

export function SchedulerModal({ isOpen, onClose, tutor }: SchedulerModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Scheduling state
  const [step, setStep] = useState<SchedulingStep>("date");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default 1 hour
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [price, setPrice] = useState<number>(0);
  
  // Constants for duration options
  const durationOptions = [
    { label: "30 minutes", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "1 hour 30 minutes", value: 90 }
  ];
  
  // Calculate price based on duration and tutor's hourly rate
  useEffect(() => {
    if (selectedDuration && tutor.hourlyRate) {
      setPrice((tutor.hourlyRate / 60) * selectedDuration);
    }
  }, [selectedDuration, tutor.hourlyRate]);
  
  // Fetch available dates and time slots
  useEffect(() => {
    if (isOpen && tutor.id) {
      loadAvailability();
    }
  }, [isOpen, tutor.id]);
  
  // Load time slots when a date is selected
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate]);
  
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStep("date");
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedDuration(60);
    }
  }, [isOpen]);
  
  const loadAvailability = async () => {
    setLoading(true);
    try {
      // Fetch tutor's availability schedule
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('tutor_availability')
        .select('availability')
        .eq('tutor_id', tutor.id)
        .single();
      
      if (availabilityError) {
        console.error("Error fetching tutor availability:", availabilityError);
        throw availabilityError;
      }
      
      if (!availabilityData || !availabilityData.availability) {
        toast({
          title: "No Availability",
          description: "This tutor hasn't set their availability yet.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Get the next 28 days and check which ones have availability
      const availableDatesArray: Date[] = [];
      const today = new Date();
      
      // For simplicity in this example, we'll just add the next 7 days as available
      // In a real implementation, you would check against the tutor's actual availability
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        availableDatesArray.push(date);
      }
      
      setAvailableDates(availableDatesArray);
      if (availableDatesArray.length > 0) {
        setSelectedDate(availableDatesArray[0]);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      toast({
        title: "Error",
        description: "Failed to load tutor's availability.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadTimeSlotsForDate = (date: Date) => {
    setLoading(true);
    try {
      // For demonstration, generate time slots from 9 AM to 5 PM in 30-min increments
      // In a real implementation, filter these based on tutor's actual availability
      const slots: string[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      
      setAvailableTimeSlots(slots);
      setSelectedTime(null); // Reset selected time when date changes
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load available time slots.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep("time");
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("duration");
  };
  
  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
    setStep("payment");
  };
  
  const handleBookSession = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedDuration) {
      toast({
        title: "Incomplete Selection",
        description: "Please complete all booking details.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    try {
      // Format the session start time
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      const startTime = `${sessionDate}T${selectedTime}:00`;
      
      // Calculate end time based on duration
      const startDateTime = parseISO(startTime);
      const endDateTime = addMinutes(startDateTime, selectedDuration);
      
      // Create the booking in the database
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course ID for now
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        null, // No location for now
        null  // No notes for now
      );
      
      if (!session) {
        throw new Error("Failed to create session");
      }
      
      // Create a payment transaction
      const hourlyRate = tutor.hourlyRate || 25; // Default to $25/hr if not set
      const sessionCost = (hourlyRate / 60) * selectedDuration;
      
      await createPaymentTransaction(
        session.id,
        user.id,
        tutor.id,
        sessionCost
      );
      
      // Success! Move to confirmation step
      setStep("confirmation");
      
      toast({
        title: "Booking Successful",
        description: "Your session has been scheduled successfully!",
      });
    } catch (error) {
      console.error("Error booking session:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, "h:mm a");
    } catch (error) {
      return time;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mr-2" />
            <p>Loading availability...</p>
          </div>
        ) : (
          <div className="p-4">
            {step === "date" && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Select a Date</h3>
                {availableDates.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground">No available dates found for this tutor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableDates.map((date, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`h-20 justify-start flex-col items-start p-3 ${
                          selectedDate && selectedDate.toDateString() === date.toDateString()
                            ? "border-usc-cardinal bg-red-50"
                            : ""
                        }`}
                        onClick={() => handleDateSelect(date)}
                      >
                        <div className="font-semibold">{format(date, "EEEE")}</div>
                        <div>{format(date, "MMMM d, yyyy")}</div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {step === "time" && selectedDate && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select a Time</h3>
                  <Button variant="outline" size="sm" onClick={() => setStep("date")}>
                    Change Date
                  </Button>
                </div>
                
                <div className="bg-muted/30 p-3 rounded mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{formatDate(selectedDate)}</span>
                  </div>
                </div>
                
                {availableTimeSlots.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground">No available time slots for this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableTimeSlots.map((time, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`h-14 ${
                          selectedTime === time ? "border-usc-cardinal bg-red-50" : ""
                        }`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {formatTime(time)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {step === "duration" && selectedDate && selectedTime && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Session Duration</h3>
                  <Button variant="outline" size="sm" onClick={() => setStep("time")}>
                    Change Time
                  </Button>
                </div>
                
                <div className="bg-muted/30 p-3 rounded mb-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{formatTime(selectedTime)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {durationOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      className={`h-16 justify-between px-4 ${
                        selectedDuration === option.value ? "border-usc-cardinal bg-red-50" : ""
                      }`}
                      onClick={() => handleDurationSelect(option.value)}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-usc-cardinal font-bold">
                        {formatCurrency((tutor.hourlyRate || 25) * (option.value / 60))}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {step === "payment" && selectedDate && selectedTime && selectedDuration && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Confirm Your Booking</h3>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Tutor</span>
                        <span className="font-medium">{tutor.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{formatTime(selectedTime)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">
                          {durationOptions.find(o => o.value === selectedDuration)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 font-bold">
                        <span>Total</span>
                        <span className="text-usc-cardinal">{formatCurrency(price)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("duration")}>
                    Back
                  </Button>
                  <Button
                    className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                    onClick={handleBookSession}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm & Pay"
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {step === "confirmation" && (
              <div className="space-y-6 py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Booking Confirmed!</h3>
                <p className="text-muted-foreground">
                  Your session with {tutor.name} has been scheduled for {selectedDate && formatDate(selectedDate)} at {selectedTime && formatTime(selectedTime)}.
                </p>
                <Button onClick={onClose} className="mt-4">
                  Done
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
