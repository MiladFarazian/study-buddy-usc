
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { useToast } from "@/hooks/use-toast";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // DISABLED WebSocket subscription to diagnose loading issues
    /* const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: (payload.new as Notification).title,
            description: (payload.new as Notification).message,
          });
        }
      )
      .subscribe(); */

    return () => {
      // supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Mark notifications as read when opening dropdown
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    // Mark as read when opening dropdown
    if (isOpen && user && unreadCount > 0) {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (unreadIds.length > 0) {
        try {
          const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
            
          if (!error) {
            setNotifications(prev => 
              prev.map(n => unreadIds.includes(n.id) ? {...n, is_read: true} : n)
            );
            setUnreadCount(0);
          } else {
            console.error("Error marking notifications as read:", error);
          }
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      }
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
        
      if (error) {
        throw error;
      }
      
      setNotifications([]);
      setUnreadCount(0);
      toast({
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-usc-cardinal text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={clearAllNotifications}
            >
              Clear all
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-usc-cardinal" />
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
