
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
  sessionDurationMinutes: number,
  customTitle?: string,
  courseId?: string | null
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
  const title = encodeURIComponent(customTitle || `Tutoring with ${tutor.name}`);
  
  // Build description including course information if available
  let descriptionText = `Tutoring session with ${tutor.name}\n` +
                        `Duration: ${sessionDurationMinutes} minutes\n`;
  
  // Add course information if available                      
  if (courseId) {
    descriptionText += `Course: ${courseId}\n`;
  }
  
  if (tutor.subjects && tutor.subjects.length > 0) {
    // Handle subjects that might be strings or objects
    const subject = tutor.subjects[0];
    const subjectName = typeof subject === 'string' ? subject : 
      (subject && typeof subject === 'object' && 'name' in subject) ? 
        (subject as any).name : 'Not specified';
        
    descriptionText += `Subject: ${subjectName}\n`;
  }
  
  const description = encodeURIComponent(descriptionText);
  const location = encodeURIComponent('USC Campus');
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;
};

export const addToGoogleCalendar = (
  tutor: Tutor,
  slot: BookingSlot,
  durationMinutes: number,
  courseId?: string | null,
  courseName?: string | null
): void => {
  if (!slot || !slot.day) {
    console.error("Invalid slot data for Google Calendar", slot);
    return;
  }
  
  const sessionDate = slot.day instanceof Date ? slot.day : new Date(slot.day);
  
  if (isNaN(sessionDate.getTime())) {
    console.error("Invalid date for Google Calendar", slot.day);
    return;
  }
  
  // Generate custom title with course if available
  const courseSuffix = courseId ? ` for ${courseName || courseId}` : '';
  const title = `Tutoring Session with ${tutor.name}${courseSuffix}`;
  
  // Generate and open URL
  try {
    const url = generateGoogleCalendarUrl(tutor, sessionDate, slot.start, durationMinutes, title, courseId);
    console.log("Opening Google Calendar URL:", url);
    window.open(url, '_blank');
  } catch (error) {
    console.error("Error opening Google Calendar:", error);
  }
};
