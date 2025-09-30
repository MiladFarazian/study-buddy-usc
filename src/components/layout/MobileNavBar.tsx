
import { 
  Home, 
  BookOpen, 
  Calendar, 
  Users, 
  GraduationCap, 
  Menu,
  MessageSquare,
  FileText,
  BarChart,
  Settings
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileNavBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isStudent, isTutor, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (!isMobile) return null;

  const getStudentTutorIcon = () => {
    if (isStudent) return GraduationCap;
    if (isTutor) return Users;
    return Users; // Default icon
  };

  const getStudentTutorPath = () => {
    if (isStudent) return "/tutors";
    if (isTutor) return "/students";
    return "/tutors"; // Default path
  };

  const getStudentTutorTitle = () => {
    if (isStudent) return "Tutors";
    if (isTutor) return "Students";
    return "Tutors"; // Default title
  };

  const allMenuItems = [
    {
      title: "Messages",
      icon: MessageSquare,
      path: "/messages",
      showWhen: !!user
    },
    {
      title: "Resources",
      icon: FileText,
      path: "/resources",
      showWhen: !!user
    },
    {
      title: "My Students",
      icon: Users,
      path: "/students",
      showWhen: isTutor
    },
    {
      title: "Badges",
      icon: Users,
      path: "/badges",
      showWhen: isTutor
    },
    {
      title: "Analytics",
      icon: BarChart,
      path: "/analytics",
      showWhen: !!user
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      showWhen: !!user
    }
  ];

  const filteredMenuItems = allMenuItems.filter(item => item.showWhen);

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      path: "/",
    },
    {
      title: getStudentTutorTitle(),
      icon: getStudentTutorIcon(),
      path: getStudentTutorPath(),
    },
    {
      title: "Courses",
      icon: BookOpen,
      path: "/courses",
    },
    {
      title: "Schedule",
      icon: Calendar,
      path: "/schedule",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = 
            item.path === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-xs",
                isActive 
                  ? "text-usc-cardinal" 
                  : "text-gray-600"
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  "mb-1",
                  isActive ? "text-usc-cardinal" : "text-gray-600"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center py-2 px-3 text-xs text-gray-600 hover:text-usc-cardinal"
            >
              <Menu size={20} className="mb-1" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-2">
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.path || 
                              (item.path.startsWith('/settings') && location.pathname.startsWith('/settings'));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md transition-colors",
                      isActive 
                        ? "bg-gray-100 text-usc-cardinal font-medium" 
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileNavBar;
