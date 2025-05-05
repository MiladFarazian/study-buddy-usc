
import { supabase } from "@/integrations/supabase/client";
import { BookingSlot, SessionCreationParams, SessionType } from "./types/booking";
import { toast } from "sonner";

/**
 * Create a new session booking
 */
export async function createSessionBooking(
  studentId: string,
  tutorId: string,
  courseId: string | null,
  startTime: string,
  endTime: string,
  location: string | null,
  notes: string | null,
  sessionType: SessionType = SessionType.IN_PERSON
) {
  try {
    console.log("Creating session with params:", {
      studentId,
      tutorId,
      courseId,
      startTime,
      endTime,
      location,
      notes,
      sessionType
    });
    
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
        payment_status: 'unpaid',
        session_type: sessionType
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating session:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error creating session booking:", error);
    throw error;
  }
}

/**
 * Book a session using a booking slot
 */
export async function bookSession(
  tutorId: string,
  studentId: string,
  slot: BookingSlot,
  duration: number,
  courseId: string | null = null,
  sessionType: SessionType = SessionType.IN_PERSON
) {
  try {
    const startDateTime = new Date(slot.day);
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);
    
    console.log("Booking session with course ID:", courseId);
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        course_id: courseId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending',
        payment_status: 'unpaid',
        session_type: sessionType
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

/**
 * Create a payment transaction for a session
 */
export async function createPaymentTransaction(sessionId: string, amount: number) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        session_id: sessionId,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating payment transaction:", error);
    return null;
  }
}

/**
 * Create a payment intent for Stripe
 */
export async function createPaymentIntent(sessionId: string, amount: number) {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        amount
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return null;
  }
}

/**
 * Process payment for a session
 */
export async function processPaymentForSession(sessionId: string, paymentMethodId: string) {
  try {
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        paymentMethodId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to process payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error processing payment:", error);
    return null;
  }
}
