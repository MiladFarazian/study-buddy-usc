
import { addDays, format, isAfter, isBefore, isSameDay, parse, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { BookingSlot, WeeklyAvailability } from "./types";
import { mapDateToDayOfWeek } from "./availability-utils";

// Get booked sessions for a tutor in a date range
export async function getTutorBookedSessions(
  tutorId: string,
  startDate: Date,
  endDate: Date
): Promise<{ start: string; end: string; date: Date }[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('start_time, end_time')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .in('status', ['pending', 'confirmed', 'in_progress']);
      
    if (error) throw error;
    
    return (data || []).map(session => ({
      start: format(new Date(session.start_time), 'HH:mm'),
      end: format(new Date(session.end_time), 'HH:mm'),
      date: new Date(session.start_time)
    }));
  } catch (error) {
    console.error("Error fetching booked sessions:", error);
    return [];
  }
}

// Generate available booking slots based on tutor availability
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: { start: string; end: string; date: Date }[],
  startDate: Date,
  daysToGenerate: number = 14
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  
  // Generate slots for the specified number of days
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = mapDateToDayOfWeek(currentDate);
    const dayAvailability = availability[dayOfWeek] || [];
    
    // Skip days with no availability
    if (dayAvailability.length === 0) continue;
    
    // Find all booked sessions for this day
    const dayBookings = bookedSessions.filter(session => 
      isSameDay(session.date, currentDate)
    );
    
    // For each availability slot on this day
    dayAvailability.forEach(availSlot => {
      // Create time slots in 30-minute increments
      const startHour = parseInt(availSlot.start.split(':')[0]);
      const startMinute = parseInt(availSlot.start.split(':')[1] || '0');
      const endHour = parseInt(availSlot.end.split(':')[0]);
      const endMinute = parseInt(availSlot.end.split(':')[1] || '0');
      
      // Start time in minutes
      let slotStartMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Generate 30-minute slots
      while (slotStartMinutes < endMinutes) {
        const slotEndMinutes = Math.min(slotStartMinutes + 30, endMinutes);
        
        // Format as HH:MM
        const startTime = `${Math.floor(slotStartMinutes / 60).toString().padStart(2, '0')}:${(slotStartMinutes % 60).toString().padStart(2, '0')}`;
        const endTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
        
        // Check if this slot overlaps with any booking
        const isBooked = dayBookings.some(booking => {
          const bookingStartMinutes = parseInt(booking.start.split(':')[0]) * 60 + parseInt(booking.start.split(':')[1]);
          const bookingEndMinutes = parseInt(booking.end.split(':')[0]) * 60 + parseInt(booking.end.split(':')[1]);
          
          return (
            (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
            (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
            (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
          );
        });
        
        if (!isBooked) {
          slots.push({
            tutorId: '', // Will be filled in by the calling code
            day: currentDate,
            start: startTime,
            end: endTime,
            available: true
          });
        }
        
        // Move to next slot
        slotStartMinutes += 30;
      }
    });
  }
  
  return slots;
}

// Book a session
export async function bookSession(
  tutorId: string,
  studentId: string,
  slot: BookingSlot,
  duration: number
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    // Convert date and time strings to ISO format
    const startDateTime = new Date(slot.day);
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);
    
    // Create session record
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      sessionId: data.id
    };
  } catch (error) {
    console.error("Error booking session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to book session"
    };
  }
}

// Create a session booking
export async function createSessionBooking(
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null
) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        course_id: courseId,
        start_time: startTime,
        end_time: endTime,
        location: location,
        notes: notes,
        status: 'pending',
        payment_status: 'unpaid'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw error;
  }
}

// Get tutor's upcoming sessions with extended details
export async function getTutorUpcomingSessions(tutorId: string) {
  try {
    // Fetch basic session data with profiles
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        student:profiles!student_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('tutor_id', tutorId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    
    // Process each session to fetch course data separately
    const processedSessions = [];
    
    // Process sessions sequentially to avoid type recursion issues
    if (sessions) {
      for (const session of sessions) {
        let courseData = null;
        
        // If there's a course_id, fetch the course details
        if (session.course_id) {
          try {
            const { data: course, error: courseError } = await supabase
              .from('courses-20251')
              .select('"Course number", "Course title"')
              .eq('id', session.course_id)
              .maybeSingle();
              
            if (!courseError && course) {
              courseData = {
                course_number: course["Course number"],
                course_title: course["Course title"]
              };
            }
          } catch (courseError) {
            console.warn("Error fetching course for session:", courseError);
          }
        }
        
        processedSessions.push({
          ...session,
          course: courseData
        });
      }
    }
    
    return processedSessions;
  } catch (error) {
    console.error("Error fetching tutor sessions:", error);
    return [];
  }
}

// Get student's upcoming sessions with extended details
export async function getStudentUpcomingSessions(studentId: string) {
  try {
    // Fetch basic session data with profiles
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!tutor_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('student_id', studentId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
      
    if (error) throw error;
    
    // Process each session to fetch course data separately
    const processedSessions = [];
    
    // Process sessions sequentially to avoid type recursion issues
    if (sessions) {
      for (const session of sessions) {
        let courseData = null;
        
        // If there's a course_id, fetch the course details
        if (session.course_id) {
          try {
            const { data: course, error: courseError } = await supabase
              .from('courses-20251')
              .select('"Course number", "Course title"')
              .eq('id', session.course_id)
              .maybeSingle();
              
            if (!courseError && course) {
              courseData = {
                course_number: course["Course number"],
                course_title: course["Course title"]
              };
            }
          } catch (courseError) {
            console.warn("Error fetching course for session:", courseError);
          }
        }
        
        processedSessions.push({
          ...session,
          course: courseData
        });
      }
    }
    
    return processedSessions;
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return [];
  }
}
