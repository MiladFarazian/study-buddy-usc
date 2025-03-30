
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthState } from "@/hooks/useAuthState";
import { Tutor } from "@/types/tutor";
import { CheckCircle } from "lucide-react";

// Define the booking steps
enum BookingStep {
  SELECT_DATE_TIME = 0,
  SELECT_DURATION = 1,
  FILL_FORM = 2,
  CONFIRMATION = 3,
}

// Define the booking form data interface
interface BookingFormData {
  notes: string;
}

// Define the complete booking data interface
interface CompleteBookingData extends BookingFormData {
  name: string;
  email: string;
}

interface SimpleBookingWizardProps {
  tutor: Tutor;
  onClose: () => void;
}

export function SimpleBookingWizard({ tutor, onClose }: SimpleBookingWizardProps) {
  const { user } = useAuthState();
  
  // State variables for the booking process
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>("60"); // Default to 60 minutes
  const [formData, setFormData] = useState<CompleteBookingData | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SELECT_DATE_TIME);
  const [notes, setNotes] = useState<string>("");
  const [name, setName] = useState<string>(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState<string>(user?.email || "");

  // Available time slots (simplified for demo)
  const getAvailableTimeSlots = (date: Date | null) => {
    if (!date) return [];
    // Mock time slots - in a real app, these would come from the tutor's availability
    return ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  };

  // Available time slots for the selected date
  const availableTimeSlots = getAvailableTimeSlots(selectedDate);

  // Available durations
  const durations = ["30", "60", "90", "120"];

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Handle duration selection
  const handleDurationSelect = (duration: string) => {
    setSelectedDuration(duration);
  };

  // Handle continue to duration selection
  const handleContinueToSelectDuration = () => {
    if (selectedDate && selectedTime) {
      setCurrentStep(BookingStep.SELECT_DURATION);
    } else {
      toast.error("Please select both a date and time to continue");
    }
  };
  
  // Handle continue to form
  const handleContinueToForm = () => {
    setCurrentStep(BookingStep.FILL_FORM);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (!name || !email) {
      toast.error("Please provide your name and email");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Create complete booking data
    const completeData: CompleteBookingData = {
      notes,
      name,
      email,
    };
    
    setFormData(completeData);
    setCurrentStep(BookingStep.CONFIRMATION);
    
    // In a real app, this would submit the booking to the server
    console.log('Booking data:', {
      date: selectedDate,
      time: selectedTime,
      duration: selectedDuration,
      student: completeData,
      tutor,
    });
  };

  // Navigation handlers
  const handleBackToDateTime = () => {
    setCurrentStep(BookingStep.SELECT_DATE_TIME);
  };
  
  const handleBackToDuration = () => {
    setCurrentStep(BookingStep.SELECT_DURATION);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedDuration("60");
    setNotes("");
    setFormData(null);
    setCurrentStep(BookingStep.SELECT_DATE_TIME);
  };

  // Calculate pricing based on duration
  const calculatePrice = (durationMinutes: string): number => {
    const hourlyRate = tutor.hourlyRate || 25;
    return (hourlyRate / 60) * parseInt(durationMinutes);
  };

  // Format the time for display
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {currentStep === BookingStep.CONFIRMATION && formData && selectedDate && selectedTime ? (
        <div className="text-center py-4 space-y-6">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground">
              Your session with {tutor.name} has been successfully booked.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md text-left">
            <h3 className="font-semibold text-lg mb-2">Session Details</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{formatTime(selectedTime)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{selectedDuration} minutes</span>
              </li>
              {notes && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="text-right max-w-[70%]">{notes}</span>
                </li>
              )}
            </ul>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              You'll receive an email confirmation with all the details.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleReset}
                variant="outline"
              >
                Book Another Session
              </Button>
              <Button 
                onClick={onClose}
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {currentStep === BookingStep.SELECT_DATE_TIME && (
            <>
              <h2 className="text-xl font-semibold">Select a Date</h2>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
              </div>
              
              {selectedDate && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Select a Time</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={selectedTime === time ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {formatTime(time)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedDate && selectedTime && (
                <div className="mt-4 text-right">
                  <Button
                    onClick={handleContinueToSelectDuration}
                    className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </>
          )}
          
          {currentStep === BookingStep.SELECT_DURATION && (
            <>
              <h2 className="text-xl font-semibold mb-4">Select Session Duration</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {durations.map((duration) => {
                  const price = calculatePrice(duration);
                  
                  return (
                    <Button
                      key={duration}
                      variant="outline"
                      className={`h-24 flex flex-col items-center justify-center p-4 ${
                        selectedDuration === duration 
                          ? "bg-red-50 border-usc-cardinal text-usc-cardinal" 
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => handleDurationSelect(duration)}
                    >
                      <span className="text-lg font-medium mb-1">{duration} minutes</span>
                      <span className="text-muted-foreground">${price.toFixed(2)}</span>
                    </Button>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleBackToDateTime}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleContinueToForm}
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                >
                  Continue
                </Button>
              </div>
            </>
          )}
          
          {currentStep === BookingStep.FILL_FORM && selectedDate && selectedTime && (
            <>
              <h2 className="text-xl font-semibold mb-4">Complete Your Booking</h2>
              
              <Card>
                <CardContent className="p-4 mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{formatTime(selectedTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{selectedDuration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${calculatePrice(selectedDuration).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Your email address"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Any specific topics or questions you'd like to cover"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleBackToDuration}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleFormSubmit}
                  className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
                >
                  Confirm Booking
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
