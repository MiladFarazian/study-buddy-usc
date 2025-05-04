
export interface ICalEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}

// Format date for iCal
const formatDateForICal = (date: Date): string => {
  // Format: YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/-|:|\.\d+/g, '').split('T').join('T');
};

// Generate iCal content
export const generateICSContent = (event: ICalEventData): string => {
  const now = new Date();
  const formattedNow = formatDateForICal(now);
  const formattedStart = formatDateForICal(event.startDate);
  const formattedEnd = formatDateForICal(event.endDate);
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//USC Tutoring//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTAMP:${formattedNow}
DTSTART:${formattedStart}
DTEND:${formattedEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
};

// Download ICS file
export const downloadICSFile = (event: ICalEventData, filename: string): void => {
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
};
