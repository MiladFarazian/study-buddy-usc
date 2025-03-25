
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, parseISO, startOfDay, endOfDay } from "date-fns";

export type AvailabilitySlot = {
  day: string;
  start: string;
  end: string;
};

export type WeeklyAvailability = {
  [key: string]: AvailabilitySlot[];
};

export type BookingSlot = {
  tutorId: string;
  day: Date;
  start: string;
  end: string;
  available: boolean;
};

// Get tutor's availability from their profile
export async function getTutorAvailability(tutorId: string): Promise<WeeklyAvailability | null> {
  try {
    if (!tutorId) {
      console.error("No tutor ID provided to getTutorAvailability");
      return null;
    }
    
    console.log("Fetching availability for tutor:", tutorId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('availability')
      .eq('id', tutorId)
      .single();
      
    if (error) {
      console.error("Error fetching tutor availability:", error);
      return null;
    }
    
    // Log the result for debugging
    console.log("Tutor availability data:", data?.availability);
    
    // Ensure we return the availability in the correct format
    if (data?.availability) {
      // Check if it's a valid object with day properties
      const avail = data.availability as WeeklyAvailability;
      const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      // Ensure all days exist in the availability object
      const cleanAvailability: WeeklyAvailability = {};
      weekDays.forEach(day => {
        cleanAvailability[day] = avail[day] || [];
      });
      
      return cleanAvailability;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return null;
  }
}

// Update tutor's availability in their profile
export async function updateTutorAvailability(
  tutorId: string, 
  availability: WeeklyAvailability
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ availability })
      .eq('id', tutorId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    return false;
  }
}

// Get existing sessions for the tutor to determine which slots are already booked
export async function getTutorBookedSessions(tutorId: string, startDate: Date, endDate: Date) {
  try {
    // Convert dates to ISO strings for the database query
    const startDateStr = startOfDay(startDate).toISOString();
    const endDateStr = endOfDay(addDays(endDate, 6)).toISOString();
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('tutor_id', tutorId)
      .gte('start_time', startDateStr)
      .lte('end_time', endDateStr)
      .in('status', ['confirmed', 'pending']);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching tutor booked sessions:", error);
    return [];
  }
}

// Generate available booking slots based on tutor's availability and existing bookings
export function generateAvailableSlots(
  availability: WeeklyAvailability,
  bookedSessions: any[],
  startDate: Date,
  daysToShow: number = 7
): BookingSlot[] {
  const slots: BookingSlot[] = [];
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Create a map of booked slots for quick lookup
  const bookedSlotMap = new Map();
  bookedSessions.forEach(session => {
    const day = format(parseISO(session.start_time), 'yyyy-MM-dd');
    const start = format(parseISO(session.start_time), 'HH:mm');
    const end = format(parseISO(session.end_time), 'HH:mm');
    const key = `${day}-${start}-${end}`;
    bookedSlotMap.set(key, true);
  });
  
  // Generate slots for each day
  for (let i = 0; i < daysToShow; i++) {
    const currentDate = addDays(startDate, i);
    const dayOfWeek = daysOfWeek[currentDate.getDay()];
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    
    // Get availability for this day of the week
    const dayAvailability = availability[dayOfWeek] || [];
    
    // For each available time slot in the day
    dayAvailability.forEach(slot => {
      // Check if the slot is already booked
      const slotKey = `${formattedDate}-${slot.start}-${slot.end}`;
      const isBooked = bookedSlotMap.has(slotKey);
      
      slots.push({
        tutorId: '',  // Will be set by the calling function
        day: currentDate,
        start: slot.start,
        end: slot.end,
        available: !isBooked
      });
    });
  }
  
  return slots;
}

// Create a new session booking
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

// Create a payment transaction for a session
export async function createPaymentTransaction(
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number
) {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating payment transaction:", error);
    throw error;
  }
}

// Update payment transaction with Stripe payment intent ID
export async function updatePaymentTransactionWithStripe(
  transactionId: string,
  stripePaymentIntentId: string
) {
  try {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'processing'
      })
      .eq('id', transactionId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating payment transaction:", error);
    return false;
  }
}

// Mark payment as completed
export async function markPaymentComplete(
  transactionId: string,
  sessionId: string
) {
  try {
    // Update payment transaction
    const { error: paymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);
      
    if (paymentError) throw paymentError;
    
    // Update session payment status
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
      
    if (sessionError) throw sessionError;
    
    return true;
  } catch (error) {
    console.error("Error marking payment complete:", error);
    return false;
  }
}
