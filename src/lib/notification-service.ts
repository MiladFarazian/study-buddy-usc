
import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "session_booked" | "message" | "system";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  metadata
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        metadata,
        is_read: false
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false);
      
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}
