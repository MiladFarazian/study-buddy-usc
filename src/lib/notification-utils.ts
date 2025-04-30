
import { supabase } from "@/integrations/supabase/client";
import { NotificationPreference } from "@/integrations/supabase/types-extension";

export type NotificationType = 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update';

export interface NotificationPreferences {
  sessionReminders: boolean;
  newMessages: boolean;
  resourceUpdates: boolean;
  platformUpdates: boolean;
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
        platformUpdates: false
      };
    }
    
    // If no preferences exist yet, return defaults
    if (!data) {
      return {
        sessionReminders: true,
        newMessages: true,
        resourceUpdates: true,
        platformUpdates: false
      };
    }
    
    return {
      sessionReminders: data.session_reminders,
      newMessages: data.new_messages,
      resourceUpdates: data.resource_updates,
      platformUpdates: data.platform_updates
    };
  } catch (error) {
    console.error("Error in getUserNotificationPreferences:", error);
    // Return default preferences if exception
    return {
      sessionReminders: true,
      newMessages: true,
      resourceUpdates: true,
      platformUpdates: false
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
          platform_updates: preferences.platformUpdates
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

// Send session reminder notification
export async function sendSessionReminder({
  userId,
  userEmail,
  userName,
  sessionId,
  sessionDate,
  tutorName,
  courseName,
  location
}: {
  userId: string;
  userEmail: string;
  userName: string;
  sessionId: string;
  sessionDate: string;
  tutorName: string;
  courseName?: string;
  location?: string;
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
      location
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
