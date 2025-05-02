
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/components/notifications/NotificationsDropdown";
import { useToast } from "./use-toast";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds);
        
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => notificationIds.includes(n.id) ? {...n, is_read: true} : n)
      );
      
      // Update unread count
      const newUnreadCount = notifications.filter(
        n => !n.is_read && !notificationIds.includes(n.id)
      ).length;
      
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
        
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({...n, is_read: true})));
      setUnreadCount(0);
      
      toast({
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);
        
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      
      toast({
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Set up subscription for real-time updates
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  };
}
