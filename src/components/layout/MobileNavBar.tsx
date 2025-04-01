
import { Home, BookOpen, Calendar, User, Users, GraduationCap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MobileNavBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isStudent, isTutor, user, profile } = useAuth();
  
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

  // Get initials for avatar fallback
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email ? user.email.substring(0, 2).toUpperCase() : "US";
  };

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

  // Check if we're on the profile page
  const isProfileActive = location.pathname.startsWith("/profile");

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
        
        {/* Profile link with avatar instead of icon */}
        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center py-2 px-3 text-xs",
            isProfileActive ? "text-usc-cardinal" : "text-gray-600"
          )}
        >
          <div className="mb-1 flex items-center justify-center">
            <Avatar className="h-5 w-5">
              <AvatarImage 
                src={profile?.avatar_url || ""} 
                alt={user?.email || "User"}
              />
              <AvatarFallback className={cn(
                "text-[10px]",
                isProfileActive ? "bg-usc-cardinal text-white" : "bg-gray-200 text-gray-600"
              )}>
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileNavBar;
