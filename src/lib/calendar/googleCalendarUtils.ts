
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";

// Helper to format date for Google Calendar URL
export const formatDateForGoogleCalendar = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

// Generate Google Calendar URL for a session
export const generateGoogleCalendarUrl = (
  tutor: Tutor,
  sessionDate: Date,
  sessionStartTime: string,
  sessionDurationMinutes: number
): string => {
  // Parse start time
  const [hours, minutes] = sessionStartTime.split(':').map(Number);
  
  // Set start date with time
  const startDate = new Date(sessionDate);
  startDate.setHours(hours, minutes);
  
  // Calculate end date
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + sessionDurationMinutes);
  
  // Format dates for Google Calendar
  const startIso = formatDateForGoogleCalendar(startDate);
  const endIso = formatDateForGoogleCalendar(endDate);
  
  // Format title and details
  const title = encodeURIComponent(`Tutoring with ${tutor.name}`);
  const description = encodeURIComponent(
    `Tutoring session with ${tutor.name}\n` +
    `Duration: ${sessionDurationMinutes} minutes\n` +
    `Subject: ${tutor.subjects?.[0]?.name || 'Not specified'}\n`
  );
  const location = encodeURIComponent('USC Campus');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;
};

export const addToGoogleCalendar = (
  tutor: Tutor,
  slot: BookingSlot,
  durationMinutes: number
): void => {
  const sessionDate = slot.day instanceof Date ? slot.day : new Date(slot.day);
  const url = generateGoogleCalendarUrl(tutor, sessionDate, slot.start, durationMinutes);
  
  // Open in a new window
  window.open(url, '_blank');
};
