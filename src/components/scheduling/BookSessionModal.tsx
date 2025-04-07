
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tutor } from "@/types/tutor";
import { BookingStepSelector } from "./booking-modal/BookingStepSelector";
import { useBookingSession } from "./booking-modal/useBookingSession";
import { PaymentSuccessScreen } from "./payment/PaymentSuccessScreen";
import { StripePaymentForm } from "./payment/StripePaymentForm"; 
import { SessionDetailsDisplay } from "./payment/SessionDetailsDisplay";
import { BookingComponent } from "./BookingComponent";
import { AuthRequiredDialog } from "./booking-modal/AuthRequiredDialog";
import { useAvailabilityData } from "./calendar/useAvailabilityData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface BookSessionModalProps {
  tutor: Tutor;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSessionModal({ tutor, isOpen, onClose }: BookSessionModalProps) {
  const {
    user,
    step,
    selectedSlot,
    creatingSession,
    authRequired,
    clientSecret,
    paymentAmount,
    paymentError,
    isTwoStagePayment,
    handleSlotSelect,
    handlePaymentComplete,
    handleCancel,
    setAuthRequired,
    retryPaymentSetup
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
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              <div className="p-6 space-y-6">
                {creatingSession ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
                    <p className="text-center text-muted-foreground">Setting up your booking...</p>
                  </div>
                ) : (
                  <>
                    <SessionDetailsDisplay 
                      tutor={tutor} 
                      selectedSlot={selectedSlot} 
                    />
                    
                    {paymentError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Payment Error</AlertTitle>
                        <AlertDescription>{paymentError}</AlertDescription>
                      </Alert>
                    )}
                    
                    {clientSecret ? (
                      <StripePaymentForm
                        clientSecret={clientSecret}
                        amount={paymentAmount}
                        onSuccess={handlePaymentComplete}
                        onCancel={handleCancel}
                        processing={false}
                        isTwoStagePayment={isTwoStagePayment}
                      />
                    ) : paymentError ? (
                      <div className="flex justify-end mt-4">
                        <button 
                          onClick={retryPaymentSetup}
                          className="bg-usc-gold hover:bg-usc-gold-dark text-black py-2 px-4 rounded"
                        >
                          Retry Payment Setup
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal mb-4" />
                        <p className="text-center text-muted-foreground">Preparing payment...</p>
                      </div>
                    )}
                  </>
                )}
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
