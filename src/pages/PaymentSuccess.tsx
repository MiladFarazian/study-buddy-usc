import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionCreated, setSessionCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const sessionId = searchParams.get('session_id');
  const stripeSessionId = searchParams.get('session_id');

  // Create session record after successful payment
  useEffect(() => {
    const createSessionRecord = async () => {
      if (!user || sessionCreated || creating || !stripeSessionId) return;
      
      console.log("🎯 PaymentSuccess: Creating session record...");
      setCreating(true);

      try {
        // Get booking data from localStorage
        const bookingData = localStorage.getItem('currentBooking');
        if (!bookingData) {
          console.error("❌ No booking data found in localStorage");
          toast.error("Booking data not found. Please contact support.");
          return;
        }

        const booking = JSON.parse(bookingData);
        console.log("📋 Booking data:", booking);

        // Create session record with paid status
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            student_id: user.id,
            tutor_id: booking.tutorId,
            course_id: booking.courseId || null,
            start_time: booking.startTime,
            end_time: booking.endTime,
            location: booking.location || null,
            notes: booking.notes || null,
            session_type: booking.sessionType || 'in_person',
            status: 'scheduled',
            payment_status: 'paid'
          })
          .select()
          .single();

        if (sessionError) {
          console.error("❌ Session creation error:", sessionError);
          toast.error("Failed to create session record");
          return;
        }

        console.log("✅ Session created:", sessionData);

        // Create payment transaction record
        const { error: paymentError } = await supabase
          .from('payment_transactions')
          .insert({
            session_id: sessionData.id,
            student_id: user.id,
            tutor_id: booking.tutorId,
            amount: booking.totalAmount || 0,
            status: 'completed',
            stripe_checkout_session_id: stripeSessionId,
            payment_completed_at: new Date().toISOString(),
            environment: 'production'
          });

        if (paymentError) {
          console.error("❌ Payment transaction error:", paymentError);
          // Don't fail completely if payment record fails - session is created
        }

        setSessionCreated(true);
        toast.success("Session booked successfully!");
        
        // Clear booking data
        localStorage.removeItem('currentBooking');

      } catch (error) {
        console.error("❌ Error creating session:", error);
        toast.error("Failed to finalize booking. Please contact support.");
      } finally {
        setCreating(false);
      }
    };

    createSessionRecord();
  }, [user, sessionCreated, creating, stripeSessionId]);

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