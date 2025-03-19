
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tutor } from "@/types/tutor";
import { BookingSlot } from "@/lib/scheduling-utils";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { initializeStripe, createPaymentIntent, processPayment } from "@/lib/stripe-utils";
import { Loader2, Calendar, Clock, DollarSign, CreditCard, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentFormProps {
  tutor: Tutor;
  selectedSlot: BookingSlot;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

export const PaymentForm = ({
  tutor,
  selectedSlot,
  sessionId,
  studentId,
  studentName,
  studentEmail,
  onPaymentComplete,
  onCancel
}: PaymentFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [cardElement, setCardElement] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Calculate session duration and cost
  const startTime = parseISO(`2000-01-01T${selectedSlot.start}`);
  const endTime = parseISO(`2000-01-01T${selectedSlot.end}`);
  const durationHours = differenceInMinutes(endTime, startTime) / 60;
  const sessionCost = tutor.hourlyRate * durationHours;
  
  useEffect(() => {
    const loadStripe = async () => {
      try {
        const stripe = await initializeStripe();
        const elements = stripe.elements();
        
        // Create the card element
        const card = elements.create('card', {
          style: {
            base: {
              iconColor: '#c4f0ff',
              color: '#000',
              fontWeight: '500',
              fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
              fontSize: '16px',
              fontSmoothing: 'antialiased',
              ':-webkit-autofill': {
                color: '#fce883',
              },
              '::placeholder': {
                color: '#87BBFD',
              },
            },
            invalid: {
              iconColor: '#FFC7EE',
              color: '#FFC7EE',
            },
          },
        });
        
        // Wait for the next repaint to mount the element
        setTimeout(() => {
          const cardElement = document.getElementById('card-element');
          if (cardElement) {
            card.mount('#card-element');
            setCardElement(card);
            setStripeLoaded(true);
          }
        }, 100);
        
        // Create a payment intent
        createPaymentIntentForSession();
        
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to load payment system. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStripe();
  }, []);
  
  const createPaymentIntentForSession = async () => {
    try {
      const formattedDate = format(selectedSlot.day, 'MMM dd, yyyy');
      const description = `Tutoring session with ${tutor.name} on ${formattedDate} at ${selectedSlot.start}`;
      
      const paymentIntent = await createPaymentIntent(
        sessionId,
        sessionCost,
        tutor.id,
        studentId,
        description
      );
      
      setClientSecret(paymentIntent.client_secret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to set up payment. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardElement || !clientSecret) {
      toast({
        title: 'Payment Error',
        description: 'Payment system not fully loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Process the payment with Stripe
      const paymentResult = await processPayment(
        clientSecret,
        cardElement,
        studentName,
        studentEmail
      );
      
      console.log('Payment successful:', paymentResult);
      
      // Show success message
      toast({
        title: 'Payment Successful',
        description: 'Your session has been booked and payment processed.',
      });
      
      setPaymentComplete(true);
      
      // Call the onPaymentComplete callback
      setTimeout(() => {
        onPaymentComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'There was an error processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  
  if (paymentComplete) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-center mb-2">Payment Successful!</CardTitle>
            <CardDescription className="text-center mb-6">
              Your session has been booked. You'll receive a confirmation email shortly.
            </CardDescription>
            <Button onClick={onPaymentComplete} className="mt-4">
              View Your Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Booking</CardTitle>
        <CardDescription>
          Enter your payment details to confirm your session with {tutor.name}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-3">Session Details</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{format(selectedSlot.day, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{selectedSlot.start} - {selectedSlot.end} ({(durationHours * 60).toFixed(0)} minutes)</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                ${tutor.hourlyRate.toFixed(2)}/hour × {durationHours.toFixed(1)} hours = ${sessionCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmitPayment}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-element">Card Details</Label>
              <div className="mt-1 border rounded-md p-3">
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div id="card-element" className="h-10"></div>
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-usc-cardinal hover:bg-usc-cardinal-dark"
                disabled={loading || processing || !stripeLoaded}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${sessionCost.toFixed(2)}
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={onCancel}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
