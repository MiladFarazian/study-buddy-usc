
/**
 * Send email notifications for session cancellation
 */
import { 
  sendNotificationEmail,
  getUserNotificationPreferences
} from "@/lib/notification-utils";
import { supabase } from "@/integrations/supabase/client";

export async function sendSessionCancellationEmails(sessionId: string): Promise<{success: boolean, error?: string}> {
  try {
    // Fetch the session details from the database
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, tutor:tutor_id(id, first_name, last_name, email:id), student:student_id(id, first_name, last_name, email:id), course_id')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.tutor.email,
        recipientName: `${session.tutor.first_name} ${session.tutor.last_name}`,
        subject: "Session Cancelled",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name} ${session.student.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.student.email,
        recipientName: `${session.student.first_name} ${session.student.last_name}`,
        subject: "Session Cancelled",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name} ${session.tutor.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending cancellation emails:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending emails" 
    };
  }
}

/**
 * Send email notifications for a new session booking
 */
export async function sendSessionBookingEmails(sessionId: string): Promise<{success: boolean, error?: string}> {
  try {
    // Fetch session data including tutor and student details
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, tutor:tutor_id(id, first_name, last_name, email:id), student:student_id(id, first_name, last_name, email:id), course_id')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.tutor.email,
        recipientName: `${session.tutor.first_name} ${session.tutor.last_name}`,
        subject: "New Tutoring Session Booked",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name} ${session.student.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.student.email,
        recipientName: `${session.student.first_name} ${session.student.last_name}`,
        subject: "Your Tutoring Session is Confirmed",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name} ${session.tutor.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending booking emails:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending emails" 
    };
  }
}

/**
 * Send reminder emails for upcoming sessions
 */
export async function sendSessionReminderEmails(sessionId: string): Promise<{success: boolean, error?: string}> {
  try {
    // Fetch session data
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, tutor:tutor_id(id, first_name, last_name, email:id), student:student_id(id, first_name, last_name, email:id), course_id')
      .eq('id', sessionId)
      .single();
      
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.student.email,
        recipientName: `${session.student.first_name} ${session.student.last_name}`,
        subject: "Reminder: Upcoming Tutoring Session",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name} ${session.tutor.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: session.tutor.email,
        recipientName: `${session.tutor.first_name} ${session.tutor.last_name}`,
        subject: "Reminder: Upcoming Tutoring Session",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name} ${session.student.last_name}`,
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending reminder emails:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending emails" 
    };
  }
}
