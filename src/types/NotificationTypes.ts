
import { NotificationType } from "@/lib/notification-service";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}
