import { Link, useLocation } from "react-router-dom";
import { 
  BarChart, 
  BookOpen, 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Users,
  CreditCard,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const location = useLocation();
  const { isStudent, isTutor, user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  if (isMobile) return null;
  
  const sidebarItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      showWhen: true // Always show
    },
    {
      title: "Courses",
      icon: BookOpen,
      path: "/courses",
      showWhen: true // Always show
    },
    {
      title: "Tutors",
      icon: Users,
      path: "/tutors",
      showWhen: true // Always show
    },
    {
      title: "My Students",
      icon: Users,
      path: "/students",
      showWhen: isTutor // Only for tutors
    },
    {
      title: "Schedule",
      icon: Calendar,
      path: "/schedule",
      showWhen: !!user // Only for authenticated users
    },
    {
      title: "Messages",
      icon: MessageSquare,
      path: "/messages",
      showWhen: !!user // Only for authenticated users
    },
    {
      title: "Resources",
      icon: FileText,
      path: "/resources",
      showWhen: !!user // Only for authenticated users
    },
    {
      title: "Analytics",
      icon: BarChart,
      path: "/analytics",
      showWhen: !!user // Only for authenticated users
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      showWhen: !!user // Only for authenticated users
    }
  ];

  const filteredItems = sidebarItems.filter(item => item.showWhen);
  
  return (
    <div className="min-h-screen w-64 bg-white text-usc-cardinal border-r border-gray-200 hidden md:block">
      <nav className="p-4 space-y-2">
        {isInitializing ? (
          <>
            {Array(5).fill(0).map((_, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-md animate-pulse"
              >
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </>
        ) : (
          filteredItems.map((item) => {
            const isActive = location.pathname === item.path || 
                          (item.path.startsWith('/settings') && location.pathname.startsWith('/settings'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-gray-100",
                  isActive ? "bg-gray-100 text-usc-cardinal font-medium" : "text-usc-cardinal"
                )}
              >
                <item.icon size={20} />
                <span>{item.title}</span>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
