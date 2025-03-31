
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  LogInIcon,
  Menu
} from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  const closeSheet = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden h-10 w-10 p-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 sm:max-w-xs">
        <div className="px-4 py-2 mb-4">
          <NavLink to="/" className="flex items-center gap-2" onClick={closeSheet}>
            <GraduationCapIcon className="h-6 w-6 text-usc-cardinal" />
            <span className="font-semibold text-xl">TutorTime</span>
          </NavLink>
        </div>
        
        <nav className="space-y-2 px-4">
          <NavLink to="/" onClick={closeSheet}>
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
          
          <NavLink to="/tutors" onClick={closeSheet}>
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
              <NavLink to="/messages" onClick={closeSheet}>
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
              
              <NavLink to="/settings" onClick={closeSheet}>
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
        
        <div className="px-4 mt-6">
          {user ? (
            <Button 
              variant="ghost"
              className="w-full justify-start gap-3" 
              onClick={handleLogout}
            >
              <LogOutIcon className="h-5 w-5" />
              Logout
            </Button>
          ) : (
            <NavLink to="/login" onClick={closeSheet}>
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
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
