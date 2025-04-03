
import { useState, useCallback } from 'react';
import { BookingSlot } from '@/lib/scheduling/types';
import { User } from '@supabase/supabase-js';

/**
 * Hook for handling slot selection in the booking flow
 */
export function useSlotSelection() {
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  
  /**
   * Calculate payment amount for a booking slot based on duration and hourly rate
   */
  const calculatePaymentAmount = useCallback((slot: BookingSlot, hourlyRate: number) => {
    // If durationMinutes isn't set on the slot, calculate it from start/end
    let durationMinutes = slot.durationMinutes;
    if (!durationMinutes && slot.start && slot.end) {
      const startParts = slot.start.split(':').map(Number);
      const endParts = slot.end.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      durationMinutes = endMinutes - startMinutes;
    }
    
    const hours = (durationMinutes || 60) / 60; // default to 1 hour if not set
    return hourlyRate * hours;
  }, []);
  
  return {
    selectedSlot,
    setSelectedSlot,
    calculatePaymentAmount
  };
}
