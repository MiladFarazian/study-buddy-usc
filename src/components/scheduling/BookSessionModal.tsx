
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling/types";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { SessionDetailsDisplay } from "./payment/SessionDetailsDisplay";
import { PaymentCardElement } from "./payment/PaymentCardElement";
import { BookingComponent } from "./BookingComponent";
import { AuthRequiredDialog } from "./booking-modal/AuthRequiredDialog";
import { useAvailabilityData } from "./calendar/useAvailabilityData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BookSessionModalProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSessionModal({ tutor, isOpen, onClose }: BookSessionModalProps) {
  const {
    user,
    profile,
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    handleSlotSelect,
    handleProceedToPayment,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired
  } = useBookingSession(tutor, isOpen, onClose);
  
  const [activeTab, setActiveTab] = useState<string>("calendar");
  const { loading, availableSlots, hasAvailability, errorMessage } = useAvailabilityData(tutor, new Date());
  
  useEffect(() => {
    if (isOpen) {
      setActiveTab("calendar");
    }
  }, [isOpen]);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Book a Session with {tutor.firstName || tutor.name.split(' ')[0]}</DialogTitle>
          </DialogHeader>
          
          {step === 'select-slot' && (
            <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="wizard">Structured Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="py-4">
                <ScrollArea className="max-h-[70vh]">
                  <div className="pr-4">
                    <BookingStepSelector 
                      tutor={tutor} 
                      onSelectSlot={handleSlotSelect} 
                      onClose={handleCancel} 
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="wizard" className="py-4">
                <ScrollArea className="max-h-[70vh]">
                  <div className="pr-4">
                    <BookingComponent
                      tutor={tutor}
                      availableSlots={availableSlots}
                      onSelectSlot={handleSlotSelect}
                      onCancel={handleCancel}
                      loading={loading}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
          
          {step === 'payment' && selectedSlot && (
            <ScrollArea className="max-h-[70vh]">
              <div className="p-6">
                <SessionDetailsDisplay tutor={tutor} selectedSlot={selectedSlot} />
                <PaymentCardElement 
                  onCardElementReady={() => {}}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePaymentComplete();
                  }}
                  onCancel={handleCancel}
                  processing={creatingSession}
                  loading={false}
                  cardError={null}
                  amount={0}
                  stripeLoaded={true}
                  clientSecret={null}
                />
              </div>
            </ScrollArea>
          )}
          
          {step === 'processing' && (
            <div className="p-6">
              <PaymentSuccessScreen onComplete={handleCancel} />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <AuthRequiredDialog 
        isOpen={authRequired} 
        onClose={() => setAuthRequired(false)} 
      />
    </>
  );
}
