
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot, createSessionBooking, createPaymentTransaction } from "@/lib/scheduling-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "./BookingCalendar";
import { BookingCalendarDrag } from "./BookingCalendarDrag";
import { PaymentForm } from "./PaymentForm";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, addMinutes, differenceInMinutes } from "date-fns";

interface BookSessionModalProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export const BookSessionModal = ({ tutor, isOpen, onClose }: BookSessionModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'select-slot' | 'payment' | 'processing'>('select-slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  
  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot);
  };
  
  const handleProceedToPayment = async () => {
    if (!selectedSlot || !user || !profile) return;
    
    setCreatingSession(true);
    
    try {
      // Format the date and times for the session
      const sessionDate = format(selectedSlot.day, 'yyyy-MM-dd');
      const startTime = `${sessionDate}T${selectedSlot.start}:00`;
      const endTime = `${sessionDate}T${selectedSlot.end}:00`;
      
      // Create the session in the database
      const session = await createSessionBooking(
        user.id,
        tutor.id,
        null, // No course selected for now
        startTime,
        endTime,
        null, // No location for now
        null  // No notes for now
      );
      
      if (!session) throw new Error("Failed to create session");
      
      // Calculate session cost
      const startTimeObj = parseISO(`2000-01-01T${selectedSlot.start}`);
      const endTimeObj = parseISO(`2000-01-01T${selectedSlot.end}`);
      const durationHours = differenceInMinutes(endTimeObj, startTimeObj) / 60;
      const sessionCost = tutor.hourlyRate * durationHours;
      
      // Create payment transaction
      const payment = await createPaymentTransaction(
        session.id,
        user.id,
        tutor.id,
        sessionCost
      );
      
      if (!payment) throw new Error("Failed to create payment transaction");
      
      setSessionId(session.id);
      setStep('payment');
      
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create the session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingSession(false);
    }
  };
  
  const handlePaymentComplete = () => {
    toast({
      title: "Booking Confirmed",
      description: "Your session has been successfully booked!",
    });
    onClose();
    navigate('/schedule');
  };
  
  const handleCancel = () => {
    // Reset state
    setStep('select-slot');
    setSelectedSlot(null);
    setSessionId(null);
    onClose();
  };
  
  if (!user || !profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Please sign in to book a session with this tutor.</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Book a Session with {tutor.name}</DialogTitle>
        </DialogHeader>
        
        {step === 'select-slot' && (
          <>
            <Tabs defaultValue="calendly" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="calendly">Calendly Style</TabsTrigger>
                <TabsTrigger value="classic">Classic View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendly">
                <BookingCalendarDrag tutor={tutor} onSelectSlot={handleSlotSelect} />
              </TabsContent>
              
              <TabsContent value="classic">
                <BookingCalendar tutor={tutor} onSelectSlot={handleSlotSelect} />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleProceedToPayment} 
                disabled={!selectedSlot || creatingSession} 
                className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
              >
                {creatingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </div>
          </>
        )}
        
        {step === 'payment' && sessionId && selectedSlot && (
          <PaymentForm 
            tutor={tutor}
            selectedSlot={selectedSlot}
            sessionId={sessionId}
            studentId={user.id}
            studentName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim()}
            studentEmail={user.email || ''}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
