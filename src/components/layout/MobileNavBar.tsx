
import { Home, BookOpen, Calendar, User, Users, GraduationCap } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const MobileNavBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isStudent, isTutor } = useAuth();
  
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
    {
      title: "Profile",
      icon: User,
      path: "/profile",
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
      </div>
    </div>
  );
};

export default MobileNavBar;
