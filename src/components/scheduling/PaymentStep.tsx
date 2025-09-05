
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { CalendarIcon, Clock, User, CreditCard, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScheduling } from '@/contexts/SchedulingContext';
import { createSessionBooking } from "@/lib/scheduling/booking-utils";
// Payment Links - no client components needed
// Payment Links - no client-side processing needed
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PaymentStep({ 
  onComplete,
  onRequireAuth
}: { 
  onComplete: () => void;
  onRequireAuth: () => void;
}) {
  const { toast } = useToast();
  const { session, user } = useAuth();
  const { state, dispatch, tutor, calculatePrice, goToPreviousStep } = useScheduling();
  const { selectedDate, selectedTimeSlot, selectedDuration, notes, studentName, studentEmail } = state;
  
  const [loading, setLoading] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate total cost
  const totalCost = selectedDuration ? calculatePrice(selectedDuration) : 0;
  
  // Format selected date and time for display
  const formattedDate = selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '';
  const formattedStartTime = selectedTimeSlot?.start || '';
  
  // Calculate end time based on duration
  const calculateEndTime = () => {
    if (!selectedTimeSlot?.start || !selectedDuration) return '';
    
    const [hours, minutes] = selectedTimeSlot.start.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedDuration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };
  
  const formattedEndTime = calculateEndTime();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!session || !user) {
      onRequireAuth();
    }
  }, [session, user, onRequireAuth]);
  
  // Create session and payment intent
  const createSessionAndPaymentIntent = async () => {
    if (!user || !tutor || !selectedDate || !selectedTimeSlot || !selectedDuration) {
      toast({
        title: "Error",
        description: "Missing required booking information.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Format date and times for the API
      const startDateTime = new Date(selectedDate);
      const [startHour, startMin] = selectedTimeSlot.start.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedDuration);
      
      // Validate user is not the tutor
      if (user.id === tutor.id) {
        setError("Tutors cannot book sessions with themselves. Please log in as a student.");
        return;
      }
      
      // Create session booking FIRST (before payment)
      console.log("🎯 PaymentStep: About to create session booking...");
      console.log("🎯 User ID:", user.id);
      console.log("🎯 Tutor ID:", tutor.id);
      console.log("🎯 Start time:", startDateTime.toISOString());
      console.log("🎯 End time:", endDateTime.toISOString());
      
      const bookingResult = await createSessionBooking(
        user.id,
        tutor.id,
        null, // courseId
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        null, // location
        notes || null
      );
      
      console.log("🎯 Booking result received:", bookingResult);
      
      if (bookingResult && bookingResult.id) {
        console.log("✅ Session created successfully with ID:", bookingResult.id);
        setSessionId(bookingResult.id);
        
        // Create payment intent with Stripe
        const sessionDate = format(startDateTime, 'MMM d, yyyy');
        const sessionTime = format(startDateTime, 'h:mm a');
        const description = `Tutoring session with ${tutor.name} on ${sessionDate} at ${sessionTime}`;
        
        // Create Payment Link instead of payment intent
        const { data: paymentLink, error: paymentError } = await supabase.functions.invoke('create-payment-link', {
          body: {
            sessionId: bookingResult.id,
            amount: totalCost,
            tutorId: tutor.id,
            description
          }
        });
        
        if (paymentError) throw paymentError;
        
        if (paymentLink?.payment_link_url) {
          // Redirect to Payment Link
          window.location.href = paymentLink.payment_link_url;
        } else {
          throw new Error("Failed to create payment link");
        }
      } else {
        console.error("❌ CRITICAL: Session booking failed - no ID returned");
        console.error("❌ Booking result was:", bookingResult);
        throw new Error("Failed to create session booking - no session ID returned");
      }
    } catch (error) {
      console.error("Error creating session or payment intent:", error);
      
      // Check for specific error about tutor not having Stripe Connect set up
      if (error.message && (
        error.message.includes("payment account") || 
        error.message.includes("Stripe Connect") ||
        error.message.includes("not completed")
      )) {
        setError("The tutor hasn't completed their payment account setup. Please try a different tutor or contact support.");
      } else {
        setError("Failed to set up booking. Please try again.");
        toast({
          title: "Error",
          description: "Failed to set up booking. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize booking and payment when component mounts
  useEffect(() => {
    if (user && tutor && selectedDate && selectedTimeSlot && selectedDuration && !sessionId) {
      createSessionAndPaymentIntent();
    }
  }, [user, tutor, selectedDate, selectedTimeSlot, selectedDuration]);
  
  const handlePaymentSuccess = () => {
    setPaymentProcessing(false);
    onComplete();
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={goToPreviousStep}
          className="pl-0 text-muted-foreground"
          disabled={loading || paymentProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Confirm and Pay</CardTitle>
          <CardDescription>
            Review your session details and complete payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Session details summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Session Details</h3>
              
              <div className="bg-muted/30 p-4 rounded-md space-y-3">
                {tutor && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">{tutor.name}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>{formattedStartTime} - {formattedEndTime}</span>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Payment form */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
                <p className="text-center text-muted-foreground">Setting up your booking...</p>
              </div>
            ) : error ? (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button 
                  onClick={goToPreviousStep} 
                  className="mt-4"
                >
                  Go Back
                </Button>
              </div>
            ) : (
              true ? (
                <div className="text-center py-10">
                  <p className="text-green-600">Redirecting to secure payment page...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-center text-red-600">
                    Unable to initialize payment. Please try again.
                  </p>
                  <Button 
                    onClick={createSessionAndPaymentIntent} 
                    variant="outline"
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
