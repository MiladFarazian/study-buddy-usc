import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationsList } from "@/components/notifications/NotificationsList";

const NavBar = ({ isMobile }: { isMobile: boolean }) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderNavLinks = () => (
    <>
      <Link to="/" className="text-sm font-medium hover:text-gray-600">
        Home
      </Link>
      <Link to="/courses" className="text-sm font-medium hover:text-gray-600">
        Courses
      </Link>
      <Link to="/tutors" className="text-sm font-medium hover:text-gray-600">
        Tutors
      </Link>
      {user && (
        <Link to="/schedule" className="text-sm font-medium hover:text-gray-600">
          Schedule
        </Link>
      )}
    </>
  );

  const MessageButton = () => (
    <Button variant="ghost" size="icon" asChild>
      <Link to="/messages">
        <MessageSquare className="h-5 w-5" />
        <span className="sr-only">Messages</span>
      </Link>
    </Button>
  );

  const UserMenu = () => (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name} />
            <AvatarFallback>{profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mr-2" align="end" forceMount>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderNotificationsBell = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 h-80" align="end">
        <NotificationsList />
      </PopoverContent>
    </Popover>
  );

  return (
    <nav className="bg-white border-b fixed top-0 left-0 right-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/">
                <img
                  className="block h-8 w-auto"
                  src="/placeholder.svg"
                  alt="Logo"
                />
              </a>
            </div>
            {!isMobile && (
              <div className="ml-6 flex space-x-8 items-center">
                {renderNavLinks()}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user && <MessageButton />}
            </div>
            <div className="ml-3">
              {user && renderNotificationsBell()}
            </div>
            <div className="ml-3">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
