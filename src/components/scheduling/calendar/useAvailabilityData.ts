
import { useState, useEffect, useCallback } from 'react';
import { Tutor } from '@/types/tutor';
import { BookingSlot } from '@/types/scheduling';
import { 
  getTutorAvailability, 
  getTutorBookedSessions, 
  generateAvailableSlots 
} from '@/lib/scheduling-utils';
import { addDays } from 'date-fns';

export const useAvailabilityData = (tutor: Tutor | null, startDate: Date) => {
  // Re-export the hook from the global hooks directory
  return require('@/hooks/useAvailabilityData').useAvailabilityData(tutor, startDate);
};
