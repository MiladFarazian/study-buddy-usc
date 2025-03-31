
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  HomeIcon, 
  UsersIcon, 
  MessageSquareIcon, 
  GraduationCapIcon,
  SettingsIcon,
  LogOutIcon,
  LogInIcon
} from "lucide-react";

export function SideNav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex flex-col border-r bg-background">
      <div className="p-3">
        <NavLink to="/" className="flex items-center gap-2 px-2">
          <GraduationCapIcon className="h-6 w-6 text-usc-cardinal" />
          <span className="font-semibold text-xl">TutorTime</span>
        </NavLink>
      </div>
      
      <nav className="space-y-1 px-3 flex-1">
        <NavLink to="/">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3", 
              isActive("/") && "bg-muted"
            )}
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </Button>
        </NavLink>
        
        <NavLink to="/tutors">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3", 
              isActive("/tutors") && "bg-muted"
            )}
          >
            <UsersIcon className="h-5 w-5" />
            Tutors
          </Button>
        </NavLink>
        
        {user && (
          <>
            <NavLink to="/messages">
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-3", 
                  isActive("/messages") && "bg-muted"
                )}
              >
                <MessageSquareIcon className="h-5 w-5" />
                Messages
              </Button>
            </NavLink>
            
            <NavLink to="/settings">
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-3", 
                  isActive("/settings") && "bg-muted"
                )}
              >
                <SettingsIcon className="h-5 w-5" />
                Settings
              </Button>
            </NavLink>
          </>
        )}
      </nav>
      
      <div className="p-3 mt-auto">
        {user ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost"
                className="w-full justify-start gap-3" 
                onClick={handleLogout}
              >
                <LogOutIcon className="h-5 w-5" />
                Logout
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout from your account</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <NavLink to="/login">
            <Button 
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <LogInIcon className="h-5 w-5" />
              Login
            </Button>
          </NavLink>
        )}
      </div>
    </div>
  );
}

export default SideNav;
