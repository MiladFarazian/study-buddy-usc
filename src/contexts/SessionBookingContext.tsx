import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SessionDetails {
  tutorName: string;
  tutorImage?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  courseName?: string;
  sessionType: string;
}

interface SessionBookingContextType {
  showConfirmation: (details: SessionDetails) => void;
  confirmationData: {
    isVisible: boolean;
    sessionDetails: SessionDetails | null;
  };
  hideConfirmation: () => void;
}

const SessionBookingContext = createContext<SessionBookingContextType | undefined>(undefined);

export function SessionBookingProvider({ children }: { children: ReactNode }) {
  const [confirmationData, setConfirmationData] = useState<{
    isVisible: boolean;
    sessionDetails: SessionDetails | null;
  }>({
    isVisible: false,
    sessionDetails: null,
  });

  const showConfirmation = (details: SessionDetails) => {
    setConfirmationData({
      isVisible: true,
      sessionDetails: details,
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      hideConfirmation();
    }, 10000);
  };

  const hideConfirmation = () => {
    setConfirmationData({
      isVisible: false,
      sessionDetails: null,
    });
  };

  return (
    <SessionBookingContext.Provider value={{
      showConfirmation,
      confirmationData,
      hideConfirmation,
    }}>
      {children}
    </SessionBookingContext.Provider>
  );
}

export function useSessionBooking() {
  const context = useContext(SessionBookingContext);
  if (context === undefined) {
    throw new Error('useSessionBooking must be used within a SessionBookingProvider');
  }
  return context;
}