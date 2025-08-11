
import { supabase } from "@/integrations/supabase/client";
import { NotificationPreference } from "@/integrations/supabase/types-extension";
import { SessionType } from "@/lib/scheduling/types/booking";

export type NotificationType = 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update' | 'session_booked' | 'session_cancellation' | 'session_reschedule';

export interface NotificationPreferences {
  sessionReminders: boolean;
  newMessages: boolean;
  resourceUpdates: boolean;
  platformUpdates: boolean;
  bookingNotifications: boolean; // New preference for booking notifications
}

// Session booking notification parameters interface
export interface SessionBookingNotificationParams {
  tutorId: string;
  tutorEmail: string;
  tutorName: string;
  studentName: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  courseName: string;
  location?: string | null;
  sessionType: SessionType;
  zoomJoinUrl?: string | null;
}

// Get user notification preferences from database
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching notification preferences:", error);
      // Return default preferences if error
      return {
        sessionReminders: true,
        newMessages: true,
        resourceUpdates: true,
        platformUpdates: false,
        bookingNotifications: true // Default to true for booking notifications
      };
    }
    
    // If no preferences exist yet, return defaults
    if (!data) {
      return {
        sessionReminders: true,
        newMessages: true,
        resourceUpdates: true,
        platformUpdates: false,
        bookingNotifications: true // Default to true for booking notifications
      };
    }
    
    return {
      sessionReminders: data.session_reminders,
      newMessages: data.new_messages,
      resourceUpdates: data.resource_updates,
      platformUpdates: data.platform_updates,
      bookingNotifications: data.booking_notifications !== false // Default to true if not set
    };
  } catch (error) {
    console.error("Error in getUserNotificationPreferences:", error);
    // Return default preferences if exception
    return {
      sessionReminders: true,
      newMessages: true,
      resourceUpdates: true,
      platformUpdates: false,
      bookingNotifications: true // Default to true for booking notifications
    };
  }
}

// Save user notification preferences to database
export async function saveUserNotificationPreferences(
  userId: string, 
  preferences: NotificationPreferences
): Promise<{success: boolean, error?: string}> {
  try {
    // First check if preferences already exist
    const { data } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let result;
    
    if (data) {
      // Update existing preferences
      result = await supabase
        .from('notification_preferences')
        .update({
          session_reminders: preferences.sessionReminders,
          new_messages: preferences.newMessages,
          resource_updates: preferences.resourceUpdates,
          platform_updates: preferences.platformUpdates,
          booking_notifications: preferences.bookingNotifications,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          session_reminders: preferences.sessionReminders,
          new_messages: preferences.newMessages,
          resource_updates: preferences.resourceUpdates,
          platform_updates: preferences.platformUpdates,
          booking_notifications: preferences.bookingNotifications
        });
    }
    
    if (result.error) {
      throw result.error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error saving preferences"
    };
  }
}

// Send a notification email through our edge function
export async function sendNotificationEmail({
  recipientEmail,
  recipientName,
  subject,
  notificationType,
  data
}: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  notificationType: NotificationType;
  data?: Record<string, any>;
}): Promise<{success: boolean, error?: string}> {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        recipientEmail,
        recipientName,
        subject,
        notificationType,
        data
      }
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending notification email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending notification"
    };
  }
}

// New helper: send notification resolving recipient email server-side by userId
export async function sendNotificationEmailToUserId({
  recipientUserId,
  recipientName,
  subject,
  notificationType,
  data
}: {
  recipientUserId: string;
  recipientName: string;
  subject: string;
  notificationType: NotificationType;
  data?: Record<string, any>;
}): Promise<{success: boolean, error?: string}> {
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: {
        recipientUserId,
        recipientName,
        subject,
        notificationType,
        data
      }
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error sending notification email (by userId):", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending notification"
    };
  }
}

// Send session booking notification to tutor
export async function sendSessionBookingNotification(params: SessionBookingNotificationParams): Promise<boolean> {
  try {
    // Check if the tutor has notifications enabled
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('booking_notifications')
      .eq('user_id', params.tutorId)
      .single();
    
    const bookingNotificationsEnabled = preferences?.booking_notifications !== false;
    
    if (!bookingNotificationsEnabled) {
      console.log(`Tutor ${params.tutorId} has booking notifications disabled`);
      return false;
    }
    
    // Prepare location text based on session type
    let locationText = "Not specified";
    if (params.sessionType === SessionType.VIRTUAL) {
      locationText = "Virtual (Zoom)";
    } else if (params.location) {
      locationText = params.location;
    }
    
    // Create notification entry in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: params.tutorId,
        type: 'session_booked',
        title: 'New Tutoring Session Booked',
        message: `${params.studentName} has booked a session with you on ${params.sessionDate} from ${params.startTime} to ${params.endTime} for ${params.courseName}.`,
        metadata: {
          session_id: params.sessionId,
          session_date: params.sessionDate,
          start_time: params.startTime,
          end_time: params.endTime,
          course_name: params.courseName,
          student_name: params.studentName,
          location: locationText,
          session_type: params.sessionType,
          zoom_link: params.zoomJoinUrl
        }
      });
    
    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }
    
    // Send email notification if email is available
    if (params.tutorEmail) {
      // Build email content
      let sessionDetails = `
        <p><strong>Date:</strong> ${params.sessionDate}</p>
        <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
        <p><strong>Course:</strong> ${params.courseName}</p>
        <p><strong>Student:</strong> ${params.studentName}</p>
        <p><strong>Session Type:</strong> ${params.sessionType === SessionType.VIRTUAL ? 'Virtual (Zoom)' : 'In Person'}</p>
      `;
      
      // Add location or Zoom link based on session type
      if (params.sessionType === SessionType.VIRTUAL && params.zoomJoinUrl) {
        sessionDetails += `<p><strong>Zoom Link:</strong> <a href="${params.zoomJoinUrl}">${params.zoomJoinUrl}</a></p>`;
      } else if (params.location) {
        sessionDetails += `<p><strong>Location:</strong> ${params.location}</p>`;
      }
      
      // Call the edge function to send the email
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: params.tutorEmail,
          subject: `New Session Booked with ${params.studentName}`,
          tutorName: params.tutorName,
          type: 'session_booked',
          content: {
            greeting: `Hi ${params.tutorName},`,
            message: `${params.studentName} has booked a new tutoring session with you.`,
            sessionDetails: sessionDetails,
            ctaText: 'View Session Details',
            ctaLink: `${window.location.origin}/schedule`
          }
        }
      });
      
      if (error) {
        console.error("Error sending booking notification email:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Failed to send session booking notification:", error);
    return false;
  }
}

// Send session booking notification to student (in-app)
export async function sendSessionBookedStudentNotification(params: {
  studentId: string;
  tutorName: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  courseName: string;
  location?: string | null;
  sessionType: SessionType;
  zoomJoinUrl?: string | null;
}): Promise<boolean> {
  try {
    // Check if the student has booking notifications enabled (defaults to true)
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('booking_notifications')
      .eq('user_id', params.studentId)
      .maybeSingle();

    const bookingNotificationsEnabled = preferences?.booking_notifications !== false;
    if (!bookingNotificationsEnabled) {
      console.log(`Student ${params.studentId} has booking notifications disabled`);
      return false;
    }

    // Prepare location text based on session type
    let locationText = 'Not specified';
    if (params.sessionType === SessionType.VIRTUAL) {
      locationText = 'Virtual (Zoom)';
    } else if (params.location) {
      locationText = params.location;
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: params.studentId,
        type: 'session_booked',
        title: 'Your session is booked',
        message: `Your session with ${params.tutorName} on ${params.sessionDate} from ${params.startTime} to ${params.endTime} for ${params.courseName} is confirmed.`,
        metadata: {
          session_id: params.sessionId,
          session_date: params.sessionDate,
          start_time: params.startTime,
          end_time: params.endTime,
          course_name: params.courseName,
          tutor_name: params.tutorName,
          location: locationText,
          session_type: params.sessionType,
          zoom_link: params.zoomJoinUrl || null,
        },
      });

    if (notificationError) {
      console.error('Error creating student booking notification:', notificationError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to create student booking notification:', error);
    return false;
  }
}

// Send session reminder notification
export async function sendSessionReminder({
  userId,
  userEmail,
  userName,
  sessionId,
  sessionDate,
  tutorName,
  courseName,
  location,
  startTime,
  endTime
}: {
  userId: string;
  userEmail: string;
  userName: string;
  sessionId: string;
  sessionDate: string;
  tutorName: string;
  courseName?: string;
  location?: string;
  startTime: string;
  endTime: string;
}): Promise<{success: boolean, error?: string}> {
  // Check if user has enabled session reminders
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.sessionReminders) {
    console.log("Session reminders disabled for user:", userId);
    return { success: true };
  }
  
  return sendNotificationEmail({
    recipientEmail: userEmail,
    recipientName: userName,
    subject: "Your Upcoming Tutoring Session",
    notificationType: 'session_reminder',
    data: {
      sessionId,
      sessionDate,
      tutorName,
      courseName,
      location,
      startTime,
      endTime
    }
  });
}

// Send new message notification
export async function sendNewMessageNotification({
  userId,
  userEmail,
  userName,
  senderName,
  messagePreview
}: {
  userId: string;
  userEmail: string;
  userName: string;
  senderName: string;
  messagePreview: string;
}): Promise<{success: boolean, error?: string}> {
  // Check if user has enabled new message notifications
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.newMessages) {
    console.log("Message notifications disabled for user:", userId);
    return { success: true };
  }
  
  return sendNotificationEmail({
    recipientEmail: userEmail,
    recipientName: userName,
    subject: `New Message from ${senderName}`,
    notificationType: 'new_message',
    data: {
      senderName,
      messagePreview
    }
  });
}

// Update the email-utils to use our new notification system
export function updateEmailUtils() {
  // This function provides a migration path from old email system to new
  console.log("Email system has been migrated to notification-utils.ts");
  console.log("Please update your code to use the new notification functions");
}
