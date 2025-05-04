
export interface ICalEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

// Format date for iCal
const formatDateForICal = (date: Date): string => {
  try {
    // Format: YYYYMMDDTHHMMSSZ
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  } catch (error) {
    console.error("Error formatting date for iCal:", error, date);
    return new Date().toISOString().replace(/-|:|\.\d+/g, '');
  }
};

// Generate iCal content
export const generateICSContent = (event: ICalEventData): string => {
  try {
    const now = new Date();
    const formattedNow = formatDateForICal(now);
    
    // Check for invalid dates and use fallbacks if needed
    const startDate = isNaN(event.startDate.getTime()) ? new Date() : event.startDate;
    const endDate = isNaN(event.endDate.getTime()) ? new Date(startDate.getTime() + 60 * 60 * 1000) : event.endDate;
    
    const formattedStart = formatDateForICal(startDate);
    const formattedEnd = formatDateForICal(endDate);
    
    // Escape special characters in text fields
    const escapedTitle = event.title.replace(/[\\;,]/g, (match) => '\\' + match);
    const escapedDesc = event.description.replace(/[\\;,]/g, (match) => '\\' + match);
    const escapedLocation = event.location.replace(/[\\;,]/g, (match) => '\\' + match);
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//USC Tutoring//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:${formattedNow}
DTSTART:${formattedStart}
DTEND:${formattedEnd}
SUMMARY:${escapedTitle}
DESCRIPTION:${escapedDesc}
LOCATION:${escapedLocation}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  } catch (error) {
    console.error("Error generating ICS content:", error, event);
    return "";
  }
};

// Download ICS file
export const downloadICSFile = (event: ICalEventData, filename: string): void => {
  try {
    const icsContent = generateICSContent(event);
    if (!icsContent) {
      console.error("Failed to generate ICS content");
      return;
    }
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    
    // Add to body to ensure it works in all browsers
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);
    
    console.log("ICS file download triggered:", filename);
  } catch (error) {
    console.error("Error downloading ICS file:", error);
  }
};
