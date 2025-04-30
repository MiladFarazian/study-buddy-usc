
import { supabase } from "@/integrations/supabase/client";
import { SessionCreationParams, SessionDetails } from "./types/booking";
import { sendSessionBookingNotification } from "@/lib/notification-utils";
import { format } from "date-fns";

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
  notes: string | null
): Promise<SessionDetails | null> {
  try {
    console.log("[createSessionBooking] Creating session with params:", {
      student_id: studentId,
      tutor_id: tutorId,
      course_id: courseId, // This is a course number string or null
      start_time: startTime,
      end_time: endTime
    });
    
    // Create the session record - ensuring courseId is stored as a string value
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        course_id: courseId, // Store course_id as string
        start_time: startTime,
        end_time: endTime,
        location: location,
        notes: notes,
        status: 'pending' as const,
        payment_status: 'unpaid' as const,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating session booking:", error);
      return null;
    }
    
    console.log("[createSessionBooking] Session created:", data);
    
    // After successfully creating the session, send notification to tutor
    // First, get the student and tutor details
    const [studentData, tutorData, courseData] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name').eq('id', studentId).single(),
      supabase.from('profiles').select('first_name, last_name').eq('id', tutorId).single(),
      courseId ? supabase.from('tutor_courses').select('course_title').eq('course_number', courseId).single() : null
    ]);
    
    // Get the tutor's email
    const { data: userData } = await supabase.auth.admin.getUserById(tutorId);
    
    if (tutorData?.data && userData?.user) {
      const tutorEmail = userData.user.email;
      const tutorName = `${tutorData.data.first_name} ${tutorData.data.last_name}`;
      const studentName = studentData?.data ? 
        `${studentData.data.first_name} ${studentData.data.last_name}` : 
        "A student";
      
      const startDate = new Date(startTime);
      const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
      const formattedStartTime = format(startDate, 'h:mm a');
      const formattedEndTime = format(new Date(endTime), 'h:mm a');
      const courseName = courseData?.data?.course_title || courseId || "General tutoring";
      
      // Send booking notification
      try {
        await sendSessionBookingNotification({
          tutorId,
          tutorEmail,
          tutorName,
          studentName,
          sessionId: data.id,
          sessionDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          courseName,
          location
        });
        console.log("[createSessionBooking] Booking notification sent to tutor");
      } catch (notifError) {
        console.error("Error sending booking notification:", notifError);
        // Don't block the booking process if notification fails
      }
    }
    
    return {
      id: data.id,
      studentId: data.student_id,
      tutorId: data.tutor_id,
      courseId: data.course_id || undefined,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location || undefined,
      notes: data.notes || undefined,
      status: data.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
      paymentStatus: data.payment_status as 'unpaid' | 'paid' | 'refunded'
    };
  } catch (err) {
    console.error("Failed to create session booking:", err);
    return null;
  }
}

/**
 * Create a new payment transaction for a session
 */
export async function createPaymentTransaction(
  sessionId: string,
  studentId: string,
  tutorId: string,
  amount: number
): Promise<boolean> {
  try {
    // Create payment transaction
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        tutor_id: tutorId,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error creating payment transaction:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Failed to create payment transaction:", err);
    return false;
  }
}

/**
 * Create a placeholder for future payment utility
 */
export function createPaymentIntent(): Promise<any> {
  return Promise.resolve(null);
}

/**
 * Process a payment for a session
 */
export async function processPaymentForSession(): Promise<boolean> {
  return Promise.resolve(true);
}
