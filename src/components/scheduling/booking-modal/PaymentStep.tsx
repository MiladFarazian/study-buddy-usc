import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useScheduling } from '@/contexts/SchedulingContext';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PaymentStepProps {
  onBack: () => void;
  onContinue: (sessionId: string, paymentSuccess: boolean) => void;
  calculatedCost?: number;
}

export function PaymentStep({ onBack, onContinue, calculatedCost = 0 }: PaymentStepProps) {
  const { state, tutor } = useScheduling();
  const { user } = useAuthState();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    response_received: false,
    client_secret_present: false,
    error_present: false
  });

  const handlePayment = async () => {
    if (!user || !tutor || !state.selectedDate || !state.selectedTimeSlot) {
      setError('Missing required data');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Creating session first...');
      
      // Calculate start and end times
      const startTime = new Date(state.selectedDate);
      const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + state.selectedDuration);

      // Create session first
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          student_id: user.id,
          tutor_id: tutor.id,
          course_id: state.selectedCourseId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: state.location,
          notes: state.notes,
          session_type: state.sessionType,
          status: 'scheduled',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError || !sessionData) {
        throw new Error('Failed to create session');
      }

      console.log('Session created:', sessionData.id);
      setSessionId(sessionData.id);
      
      console.log('Calling Edge Function...');
      
      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          sessionId: sessionData.id,
          amount: calculatedCost,
          tutorId: tutor.id,
          studentId: user.id,
          description: `Tutoring session with ${tutor.firstName || tutor.name}`
        }
      });
      
      setDebugInfo({
        response_received: !!data,
        client_secret_present: !!(data?.client_secret),
        error_present: !!fnError
      });
      
      if (fnError) throw fnError;
      if (!data?.client_secret) throw new Error('No client_secret in response');
      
      console.log('Success! Got client_secret:', data.client_secret.slice(-6));
      
      // For now, just continue without actual payment processing
      onContinue(sessionData.id, true);
      
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = () => {
    if (!state.selectedDate || !state.selectedTimeSlot) return '';
    
    const date = new Date(state.selectedDate);
    const [startHour, startMinute] = state.selectedTimeSlot.start.split(':').map(Number);
    date.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + state.selectedDuration);
    
    return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };

  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tutor:</span>
              <span className="font-medium">{tutor?.firstName || tutor?.name} {tutor?.lastName || ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Session:</span>
              <span className="font-medium">{formatDateTime()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <span className="font-medium">{state.selectedDuration} minutes</span>
            </div>
            {state.selectedCourseId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Course:</span>
                <span className="font-medium">{state.selectedCourseId}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${calculatedCost.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel */}
      <div className="text-sm bg-gray-100 p-4 rounded space-y-1">
        <div>Response received: {debugInfo.response_received ? 'YES' : 'NO'}</div>
        <div>Client secret: {debugInfo.client_secret_present ? 'YES' : 'NO'}</div>
        <div>Error: {debugInfo.error_present ? 'YES' : 'NO'}</div>
        {sessionId && <div>Session ID: {sessionId}</div>}
      </div>
      
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 bg-usc-cardinal hover:bg-usc-cardinal/90"
        >
          {loading ? 'Processing...' : 'Test Payment Connection'}
        </Button>
      </div>
    </div>
  );
}