import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

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