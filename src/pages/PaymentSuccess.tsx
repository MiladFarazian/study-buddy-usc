import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { dollarsToCents } from '@/lib/currency-utils';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionCreated, setSessionCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const sessionId = searchParams.get('session_id');
  const stripeSessionId = searchParams.get('cs_id');

  // Note: Session creation now happens in handleBookingComplete function
  // This page is only reached when payment links redirect here (rare case)
  // Most users stay on the booking modal and don't navigate to this page

  useEffect(() => {
    // Close this window and notify parent if opened in popup
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_SUCCESS',
        sessionId: sessionId
      }, '*');
      window.close();
    }
  }, [sessionId]);

  // Add session creation as backup if user reaches this page
  useEffect(() => {
    const createSessionFromPaymentSuccess = async () => {
      console.log("SESSION CREATION STARTING - PaymentSuccess");
      console.log("🎯 PaymentSuccess: Creating session record...");
      
      if (!sessionId || !user || creating || sessionCreated) {
        console.log("❌ PaymentSuccess: Missing requirements:", { sessionId: !!sessionId, user: !!user, creating, sessionCreated });
        return;
      }

      setCreating(true);

      try {
        // Get booking data from localStorage
        const bookingDataStr = localStorage.getItem('currentBooking');
        if (!bookingDataStr) {
          console.error("❌ PaymentSuccess: No booking data found in localStorage");
          return;
        }

        const booking = JSON.parse(bookingDataStr);
        console.log("💾 PaymentSuccess: Retrieved booking data:", booking);

        // Create session record
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            student_id: user.id,
            tutor_id: booking.tutorId,
            course_id: booking.courseId,
            start_time: booking.startTime,
            end_time: booking.endTime,
            location: booking.location || 'Location TBD',
            notes: booking.notes,
            session_type: booking.sessionType || 'in_person',
            status: 'scheduled',
            payment_status: 'paid'
          })
          .select()
          .single();

        if (sessionError) {
          console.error("❌ PaymentSuccess: Session creation error:", sessionError);
          toast.error("Failed to create session record");
          return;
        }

        console.log("✅ PaymentSuccess: Session created:", sessionData);

        // Update existing payment transaction record or create if not found
        const { error: paymentError } = await supabase
          .from('payment_transactions')
          .upsert({
            session_id: sessionData.id,
            student_id: user.id,
            tutor_id: booking.tutorId,
            amount: dollarsToCents(booking.totalAmount || 0),
            status: 'completed',
            payment_completed_at: new Date().toISOString(),
            environment: 'production',
            stripe_checkout_session_id: stripeSessionId
          }, { 
            onConflict: 'stripe_checkout_session_id'
          });

        if (paymentError) {
          console.error("❌ PaymentSuccess: Payment transaction error:", paymentError);
        }

        setSessionCreated(true);
        toast.success("Session created successfully!");
        
        // Clear booking data
        localStorage.removeItem('currentBooking');
        
      } catch (error) {
        console.error("❌ PaymentSuccess: Error creating session:", error);
        toast.error("Failed to create session");
      } finally {
        setCreating(false);
      }
    };

    createSessionFromPaymentSuccess();
  }, [sessionId, user, creating, sessionCreated]);

  const handleContinue = () => {
    // If not in popup, redirect to home with success message
    navigate('/', { 
      state: { 
        paymentSuccess: true, 
        sessionId: sessionId 
      } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Your payment has been processed successfully.
            </p>
            {sessionId && (
              <p className="text-sm text-muted-foreground mt-2">
                Session ID: {sessionId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finalizing your booking...
            </div>
            
            <Button onClick={handleContinue} className="w-full">
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}