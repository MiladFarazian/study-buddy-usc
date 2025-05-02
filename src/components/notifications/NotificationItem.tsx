
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import type { Notification } from "./NotificationsDropdown";

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  // Format the notification time
  const formattedTime = notification.created_at ? 
    formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : '';
  
  // Format different notification types with different icons and styles
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'session_booked':
        return <Calendar className="h-5 w-5 text-usc-cardinal" />;
      case 'new_message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Build link for notification based on type and metadata
  const getNotificationLink = () => {
    switch (notification.type) {
      case 'session_booked':
        return '/schedule';
      case 'new_message':
        return '/messages';
      default:
        return '#';
    }
  };
  
  return (
    <Link
      to={getNotificationLink()}
      className={`flex items-start p-4 hover:bg-gray-50 border-b ${notification.is_read ? 'opacity-75' : 'bg-blue-50/30'}`}
    >
      <div className="mr-3 mt-1">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {notification.message}
        </p>
        {notification.metadata && notification.metadata.session_date && (
          <div className="mt-1 text-xs text-gray-700">
            {notification.metadata.session_date} {notification.metadata.start_time}-{notification.metadata.end_time}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formattedTime}
        </p>
      </div>
      {!notification.is_read && (
        <div className="h-2 w-2 rounded-full bg-usc-cardinal mt-2"></div>
      )}
    </Link>
  );
}
