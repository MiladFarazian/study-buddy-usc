
import { useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationsContext";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMessaging } from "@/hooks/useMessaging";

const NavBar = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount: notificationCount } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { conversations } = useMessaging();
  
  // Calculate unread message count
  const unreadMessageCount = conversations.reduce(
    (total, conversation) => total + (conversation.unread_count || 0),
    0
  );

  return (
    <header className="border-b border-gray-200 bg-white w-full">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">
              <span className="text-usc-cardinal">Study</span>
              <span className="text-usc-gold">Buddy</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  )}
                </Link>
              </Button>
              
              <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0">
                  <NotificationsList />
                </SheetContent>
              </Sheet>
            </>
          )}

          {!isMobile && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
