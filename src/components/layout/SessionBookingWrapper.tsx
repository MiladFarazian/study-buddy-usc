import React from 'react';
import { useSessionBooking } from '@/contexts/SessionBookingContext';
import { SessionBookingConfirmation } from '@/components/sessions/SessionBookingConfirmation';

export function SessionBookingWrapper() {
  const { confirmationData, hideConfirmation } = useSessionBooking();

  return (
    <SessionBookingConfirmation
      isVisible={confirmationData.isVisible}
      onClose={hideConfirmation}
      sessionDetails={confirmationData.sessionDetails || {
        tutorName: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        sessionType: ''
      }}
    />
  );
}