
import { BookingSlot } from "@/lib/scheduling/types";
import { Tutor } from "@/types/tutor";

// Helper to format date for Google Calendar URL
export const formatDateForGoogleCalendar = (date: Date): string => {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date provided to formatDateForGoogleCalendar:", date);
      return new Date().toISOString().replace(/-|:|\.\d+/g, '');
    }
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  } catch (error) {
    console.error("Error in formatDateForGoogleCalendar:", error);
    return new Date().toISOString().replace(/-|:|\.\d+/g, '');
  }
};

// Generate Google Calendar URL for a session
export const generateGoogleCalendarUrl = (
  tutor: Tutor,
  sessionDate: Date,
  sessionStartTime: string,
  sessionDurationMinutes: number,
  customTitle?: string,
  courseId?: string | null,
  options?: {
    description?: string;
    location?: string;
    attendees?: string[]; // emails
  }
): string => {
  try {
    console.log("generateGoogleCalendarUrl inputs:", {
      tutor, sessionDate, sessionStartTime, sessionDurationMinutes, customTitle, courseId, options
    });
    
    // Validate inputs
    if (!tutor || !(sessionDate instanceof Date) || isNaN(sessionDate.getTime())) {
      console.error("Invalid input for calendar URL generation:", { tutor, sessionDate });
      throw new Error("Invalid input parameters");
    }

    // Parse start time
    const timeParts = sessionStartTime.split(':');
    if (timeParts.length !== 2) {
      console.error("Invalid time format:", sessionStartTime);
      throw new Error("Invalid time format");
    }
    
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.error("Invalid time values:", { hours, minutes });
      throw new Error("Invalid time values");
    }
    
    console.log("Parsed time:", { hours, minutes });
    
    // Clone the date to avoid modifying the original
    const startDate = new Date(sessionDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + sessionDurationMinutes);
    
    console.log("Calendar dates calculated:", { startDate, endDate });
    
    // Format dates for Google Calendar
    const startIso = formatDateForGoogleCalendar(startDate);
    const endIso = formatDateForGoogleCalendar(endDate);
    
    console.log("Formatted ISO dates:", { startIso, endIso });
    
    // Format title and details
    const title = encodeURIComponent(customTitle || `Tutoring with ${tutor.name}`);
    
    // Build default description including course information if available
    let descriptionText = `Tutoring session with ${tutor.name}\n` +
                        `Duration: ${sessionDurationMinutes} minutes\n`;
    
    if (courseId) {
      descriptionText += `Course: ${courseId}\n`;
    }
    
    if (tutor.subjects && tutor.subjects.length > 0) {
      const subject = tutor.subjects[0];
      const subjectName = typeof subject === 'string' ? subject : 
        (subject && typeof subject === 'object' && 'name' in subject) ? 
          (subject as any).name : 'Not specified';
      descriptionText += `Subject: ${subjectName}\n`;
    }

    // Override with provided description if present
    const description = encodeURIComponent(options?.description ?? descriptionText);
    
    // Location handling
    const location = encodeURIComponent(options?.location ?? 'USC Campus');

    // Base URL
    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;

    // Add attendees if provided
    if (options?.attendees && options.attendees.length > 0) {
      const attendeeStr = encodeURIComponent(options.attendees.join(','));
      url += `&add=${attendeeStr}`;
    }

    console.log("Generated Google Calendar URL:", url);
    return url;
  } catch (error) {
    console.error("Error generating Google Calendar URL:", error);
    // Return a fallback URL that will at least open Google Calendar
    return "https://calendar.google.com/calendar/";
  }
};

export const addToGoogleCalendar = (
  tutor: Tutor,
  slot: BookingSlot,
  durationMinutes: number,
  courseId?: string | null,
  courseName?: string | null
): void => {
  try {
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
    
    console.log("addToGoogleCalendar data:", {
      tutor, sessionDate, slotStart: slot.start, durationMinutes, title
    });
    
    // Generate and open URL
    const url = generateGoogleCalendarUrl(tutor, sessionDate, slot.start, durationMinutes, title, courseId);
    console.log("Opening Google Calendar URL:", url);
    window.open(url, '_blank');
  } catch (error) {
    console.error("Error opening Google Calendar:", error);
  }
};
