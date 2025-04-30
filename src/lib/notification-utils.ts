
import { supabase } from "@/integrations/supabase/client";
import { NotificationPreference } from "@/integrations/supabase/types-extension";

export type NotificationType = 'session_reminder' | 'new_message' | 'resource_update' | 'platform_update';

export interface NotificationPreferences {
  sessionReminders: boolean;
  newMessages: boolean;
  resourceUpdates: boolean;
  platformUpdates: boolean;
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  sessionReminders: true,
  newMessages: true,
  resourceUpdates: true,
  platformUpdates: false
};

// Get user notification preferences from database
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    // First check if preferences exist for the user
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching notification preferences:", error);
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
    
    // If no preferences exist yet, create default preferences
    if (!data) {
      console.log("No preferences found, creating default preferences for user:", userId);
      const { error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          session_reminders: DEFAULT_NOTIFICATION_PREFERENCES.sessionReminders,
          new_messages: DEFAULT_NOTIFICATION_PREFERENCES.newMessages,
          resource_updates: DEFAULT_NOTIFICATION_PREFERENCES.resourceUpdates,
          platform_updates: DEFAULT_NOTIFICATION_PREFERENCES.platformUpdates
        });
      
      if (createError) {
        console.error("Error creating default notification preferences:", createError);
      }
      
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
    
    return {
      sessionReminders: data.session_reminders,
      newMessages: data.new_messages,
      resourceUpdates: data.resource_updates,
      platformUpdates: data.platform_updates
    };
  } catch (error) {
    console.error("Error in getUserNotificationPreferences:", error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
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
    console.log("Sending notification email:", { 
      recipientEmail,
      recipientName,
      subject,
      notificationType,
      data
    });
    
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
    
    console.log("Notification email sent successfully");
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

// Function to ensure a user has notification preferences
export async function ensureNotificationPreferences(userId: string): Promise<void> {
  if (!userId) return;
  
  try {
    // Check if preferences already exist
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking for notification preferences:", error);
      return;
    }
    
    // If no preferences exist, create defaults
    if (!data) {
      console.log("Creating default notification preferences for user:", userId);
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          session_reminders: DEFAULT_NOTIFICATION_PREFERENCES.sessionReminders,
          new_messages: DEFAULT_NOTIFICATION_PREFERENCES.newMessages,
          resource_updates: DEFAULT_NOTIFICATION_PREFERENCES.resourceUpdates,
          platform_updates: DEFAULT_NOTIFICATION_PREFERENCES.platformUpdates
        });
        
      if (insertError) {
        console.error("Error creating default notification preferences:", insertError);
      }
    }
  } catch (error) {
    console.error("Error in ensureNotificationPreferences:", error);
  }
}
