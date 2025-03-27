
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Notification, useNotifications } from "@/contexts/NotificationsContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

export const NotificationsList = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === "session_booked" && notification.metadata?.sessionId) {
      navigate(`/schedule`);
    } else if (notification.type === "message" && notification.metadata?.conversationId) {
      navigate(`/messages?conversation=${notification.metadata.conversationId}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {notifications.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => markAllAsRead()}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
                <div className="text-sm mt-1 text-gray-600">{notification.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p>No notifications</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
