import { supabase } from "@/integrations/supabase/client";
import { SessionDetails, SessionType } from "./types/booking";
import { sendSessionBookingNotification, sendSessionBookedStudentNotification } from "@/lib/notification-utils";
import { format } from "date-fns";
import { createZoomMeeting as createZoomMeetingAPI, getDurationFromSession, getUserTimezone, updateZoomMeeting as updateZoomMeetingAPI, deleteZoomMeeting as deleteZoomMeetingAPI } from "@/lib/zoomAPI";
import { sendBookingConfirmation, sendRescheduleNotification, sendCancellationNotification } from "@/lib/emailService";

/**
 * Zoom meeting creation handled by src/lib/zoomAPI.js
 * Using standardized response and helper utilities.
 */

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
): Promise<SessionDetails | null> {
  try {
    console.log("[createSessionBooking] Creating session with params:", {
      student_id: studentId,
      tutor_id: tutorId,
      course_id: courseId, // This is a course number string or null
      start_time: startTime,
      end_time: endTime,
      location: location,
      session_type: sessionType,
      status_will_be: 'scheduled'
    });
    
    // If it's a virtual session, create a Zoom meeting
    let zoomMeetingId: string | null = null;
    let zoomJoinUrl: string | null = null;
    let zoomStartUrl: string | null = null;
    let zoomPassword: string | null = null;
    
    if (sessionType === SessionType.VIRTUAL) {
      // Get student information
      const { data: studentData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();
        
      // Get course information (if provided)
      const courseName = courseId ? 
        (await supabase.from('tutor_courses').select('course_title').eq('course_number', courseId).single())?.data?.course_title || courseId :
        "Tutoring Session";
        
      const studentName = studentData ? 
        `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() : 
        "Student";
        
      const duration = getDurationFromSession(startTime, endTime);
      const timezone = getUserTimezone();

      const zoomResp = await createZoomMeetingAPI({
        tutor_id: tutorId,
        student_name: studentName,
        course_name: courseName,
        start_time: startTime,
        end_time: endTime,
        duration,
        timezone,
        auto_recording: "cloud",
      } as any);
      
      if (zoomResp?.error) {
        console.error("[createSessionBooking] Zoom create error:", zoomResp.error);
      } else if (zoomResp) {
        zoomMeetingId = zoomResp.id || null;
        zoomJoinUrl = zoomResp.join_url || null;
        zoomStartUrl = zoomResp.start_url || null;
        zoomPassword = zoomResp.password || null;
      }

    }
    
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
        status: 'scheduled' as const,
        payment_status: 'unpaid' as const,
        session_type: sessionType,
        zoom_meeting_id: zoomMeetingId,
        zoom_join_url: zoomJoinUrl,
        zoom_start_url: zoomStartUrl,
        zoom_password: zoomPassword,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error("[createSessionBooking] Supabase error:", error);
      console.error("[createSessionBooking] Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
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
    
    if (tutorData?.data) {
      const tutorName = `${tutorData.data.first_name} ${tutorData.data.last_name}`;
      const studentName = studentData?.data ? 
        `${studentData.data.first_name} ${studentData.data.last_name}` : 
        "A student";
      
      const startDate = new Date(startTime);
      const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
      const formattedStartTime = format(startDate, 'h:mm a');
      const formattedEndTime = format(new Date(endTime), 'h:mm a');
      const courseName = courseData?.data?.course_title || courseId || "General tutoring";
      
      // Create in-app notification and trigger email server-side (no admin calls in browser)
      try {
        await sendSessionBookingNotification({
          tutorId,
          tutorEmail: undefined,
          tutorName,
          studentName,
          sessionId: data.id,
          sessionDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          courseName,
          location,
          sessionType,
          zoomJoinUrl
        });
        console.log("[createSessionBooking] Booking notification created for tutor");
      } catch (notifError) {
        console.error("Error creating booking notification:", notifError);
        // Don't block the booking process if notification fails
      }

      // Also create an in-app notification for the student
      try {
        await sendSessionBookedStudentNotification({
          studentId,
          tutorName,
          sessionId: data.id,
          sessionDate: formattedDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          courseName,
          location,
          sessionType,
          zoomJoinUrl
        });
        console.log("[createSessionBooking] Booking notification created for student");
      } catch (notifError) {
        console.error("Error creating student booking notification:", notifError);
      }
    }

    // Email confirmations to both tutor and student (non-blocking)
    try {
      console.log('[createSessionBooking] Triggering sendBookingConfirmation...', { sessionId: data.id });
      const result = await sendBookingConfirmation(data.id);
      console.log('[createSessionBooking] sendBookingConfirmation result:', result);
    } catch (e) {
      console.error('[createSessionBooking] sendBookingConfirmation error:', e);
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
      status: data.status as 'scheduled' | 'in_progress' | 'cancelled' | 'completed',
      paymentStatus: data.payment_status as 'unpaid' | 'paid' | 'refunded',
      sessionType: data.session_type as SessionType,
      zoomMeetingId: data.zoom_meeting_id || undefined,
      zoomJoinUrl: data.zoom_join_url || undefined,
      zoomStartUrl: data.zoom_start_url || undefined,
      zoomPassword: data.zoom_password || undefined
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

// Session modification helpers leveraging standardized Zoom API
export async function rescheduleSessionBooking(
  sessionId: string,
  newStartTime: string,
  newEndTime: string
): Promise<boolean> {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (fetchError || !session) throw fetchError || new Error('Session not found');

    const isVirtual = session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL;

    if (isVirtual && session.zoom_meeting_id) {
      const duration = getDurationFromSession(newStartTime, newEndTime);
      const timezone = getUserTimezone();
      const zoomResp = await updateZoomMeetingAPI(session.zoom_meeting_id, {
        start_time: newStartTime,
        duration,
        timezone,
      } as any);
      if (zoomResp?.error) {
        console.error('[rescheduleSessionBooking] Zoom update error:', zoomResp.error);
      }
    }

    const oldStartTime = session.start_time as string;
    const oldEndTime = session.end_time as string;

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        start_time: newStartTime,
        end_time: newEndTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    if (updateError) throw updateError;

    // Non-blocking email notification
    try {
      await sendRescheduleNotification(sessionId, { oldStartTime, oldEndTime });
    } catch (e) {
      console.error('[rescheduleSessionBooking] sendRescheduleNotification error:', e);
    }

    return true;
  } catch (e) {
    console.error('Failed to reschedule session:', e);
    return false;
  }
}

export async function cancelSessionBooking(sessionId: string): Promise<boolean> {
  try {
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, session_type, zoom_meeting_id')
      .eq('id', sessionId)
      .single();
    if (fetchError || !session) throw fetchError || new Error('Session not found');

    if ((session.session_type === 'virtual' || session.session_type === SessionType.VIRTUAL) && session.zoom_meeting_id) {
      const resp = await deleteZoomMeetingAPI(session.zoom_meeting_id);
      if (resp?.error) {
        console.error('[cancelSessionBooking] Zoom delete error:', resp.error);
      }
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        zoom_meeting_id: null,
        zoom_join_url: null,
        zoom_start_url: null,
        zoom_password: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    if (updateError) throw updateError;

    // Non-blocking email notification
    try {
      await sendCancellationNotification(sessionId);
    } catch (e) {
      console.error('[cancelSessionBooking] sendCancellationNotification error:', e);
    }

    return true;
  } catch (e) {
    console.error('Failed to cancel session:', e);
    return false;
  }
}
