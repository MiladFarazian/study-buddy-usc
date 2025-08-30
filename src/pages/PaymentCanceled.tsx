import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCanceled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Close this window and notify parent if opened in popup
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_CANCELED',
        sessionId: sessionId
      }, '*');
      window.close();
    }
  }, [sessionId]);

  const handleRetry = () => {
    // If not in popup, redirect to home
    navigate('/', { 
      state: { 
        paymentCanceled: true, 
        sessionId: sessionId 
      } 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Payment Canceled
            </h1>
            <p className="text-muted-foreground">
              Your payment was canceled. No charges were made.
            </p>
            {sessionId && (
              <p className="text-sm text-muted-foreground mt-2">
                Session ID: {sessionId}
              </p>
            )}
          </div>

          <Button onClick={handleRetry} className="w-full">
            Return to Booking
          </Button>
        </div>
      </div>
    </div>
  );
}