
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BookingSlot, Session } from '@/lib/scheduling/types';
import { Tutor } from '@/types/tutor';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Hook for handling session creation in the booking flow
 */
export function useSessionCreation() {
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  /**
   * Creates a session in the database from a booking slot
   */
  const createSession = useCallback(async (
    slot: BookingSlot, 
    user: User | null, 
    tutor: Tutor
  ) => {
    if (!user) {
      return null;
    }
    
    setCreatingSession(true);
    
    try {
      // Calculate start and end times from the slot data
      const startTime = new Date(slot.day);
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(slot.day);
      const [endHour, endMinute] = slot.end.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      // Enhance the slot with calculated properties
      slot.startTime = startTime;
      slot.endTime = endTime;
      
      // Create the session in the database
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          tutor_id: tutor.id,
          student_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating session:', error);
        toast.error('Could not create session. Please try again.');
        setCreatingSession(false);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Exception creating session:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setCreatingSession(false);
      return null;
    }
  }, []);
  
  return {
    creatingSession,
    setCreatingSession,
    sessionId,
    setSessionId,
    createSession
  };
}
