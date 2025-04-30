
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
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
        student:profiles!sessions_student_id_fkey(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
    
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Get user emails
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.getUserById(session.tutor.id);
    if (tutorError) throw new Error(`Error fetching tutor data: ${tutorError.message}`);
    
    const { data: studentData, error: studentError } = await supabase.auth.admin.getUserById(session.student.id);
    if (studentError) throw new Error(`Error fetching student data: ${studentError.message}`);
    
    if (!tutorData?.user?.email || !studentData?.user?.email) {
      throw new Error('Could not retrieve user emails');
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorData.user.email,
        recipientName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
        subject: "Session Cancelled",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentData.user.email,
        recipientName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
        subject: "Session Cancelled",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
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
    // Fetch session data including tutor and student details with proper column hints
    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
        student:profiles!sessions_student_id_fkey(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
    
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Get user emails
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.getUserById(session.tutor.id);
    if (tutorError) throw new Error(`Error fetching tutor data: ${tutorError.message}`);
    
    const { data: studentData, error: studentError } = await supabase.auth.admin.getUserById(session.student.id);
    if (studentError) throw new Error(`Error fetching student data: ${studentError.message}`);
    
    if (!tutorData?.user?.email || !studentData?.user?.email) {
      throw new Error('Could not retrieve user emails');
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorData.user.email,
        recipientName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
        subject: "New Tutoring Session Booked",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentData.user.email,
        recipientName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
        subject: "Your Tutoring Session is Confirmed",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
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
    // Fetch session data with proper column hints
    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutor:profiles!sessions_tutor_id_fkey(id, first_name, last_name),
        student:profiles!sessions_student_id_fkey(id, first_name, last_name)
      `)
      .eq('id', sessionId)
      .single();
      
    if (error) {
      throw new Error(`Error fetching session data: ${error.message}`);
    }
    
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Get user emails
    const { data: tutorData, error: tutorError } = await supabase.auth.admin.getUserById(session.tutor.id);
    if (tutorError) throw new Error(`Error fetching tutor data: ${tutorError.message}`);
    
    const { data: studentData, error: studentError } = await supabase.auth.admin.getUserById(session.student.id);
    if (studentError) throw new Error(`Error fetching student data: ${studentError.message}`);
    
    if (!tutorData?.user?.email || !studentData?.user?.email) {
      throw new Error('Could not retrieve user emails');
    }
    
    // Check if student has notifications enabled
    const studentPrefs = await getUserNotificationPreferences(session.student.id);
    if (studentPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: studentData.user.email,
        recipientName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
        subject: "Reminder: Upcoming Tutoring Session",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          tutorName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
          courseName: session.course_id || 'Not specified',
          location: session.location || 'Not specified'
        }
      });
    }
    
    // Check if tutor has notifications enabled
    const tutorPrefs = await getUserNotificationPreferences(session.tutor.id);
    if (tutorPrefs.sessionReminders) {
      await sendNotificationEmail({
        recipientEmail: tutorData.user.email,
        recipientName: `${session.tutor.first_name || ''} ${session.tutor.last_name || ''}`.trim(),
        subject: "Reminder: Upcoming Tutoring Session",
        notificationType: 'session_reminder',
        data: {
          sessionDate: session.start_time,
          studentName: `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim(),
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
