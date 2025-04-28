
// This is a simple utility to generate ICS files for Apple Calendar and other calendar apps
// This is a basic implementation - it can be enhanced with more fields as needed

export interface ICalEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

export function generateICS(event: ICalEventData): string {
  // Format dates to iCalendar format YYYYMMDDTHHMMSSZ
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '').substring(0, 15) + 'Z';
  };
  
  const startDateFormatted = formatDate(event.startDate);
  const endDateFormatted = formatDate(event.endDate);
  const now = formatDate(new Date());
  
  // Generate a unique ID for the event
  const uid = `${now}-${Math.floor(Math.random() * 1000000)}@uscstudybuddy`;
  
  // Generate the ICS content
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `DTSTART:${startDateFormatted}`,
    `DTEND:${endDateFormatted}`,
    `DTSTAMP:${now}`,
    `CREATED:${now}`,
    event.url ? `URL:${event.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  
  return icsContent;
}

export function downloadICSFile(event: ICalEventData, filename = 'tutoring-session.ics'): void {
  const icsContent = generateICS(event);
  
  // Create a Blob with the ICS content
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  
  // Create a link element and trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
