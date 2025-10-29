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
  Loader2,
  HelpCircle,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { isTutorView, isStudentView } = useViewMode();
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
      showWhen: isStudentView // Only show for students
    },
    {
      title: "My Students",
      icon: Users,
      path: "/students",
      showWhen: isTutorView // Only for tutors
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
      showWhen: !!user
    },
    {
      title: "Badges",
      icon: Users,
      path: "/badges",
      showWhen: isTutorView // Only for tutors
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
      showWhen: !!user // Only for authenticated users
    },
    {
      title: "FAQ",
      icon: HelpCircle,
      path: "/faq",
      showWhen: true // Always show
    },
    {
      title: "Make School Easy",
      icon: Sparkles,
      path: "/make-school-easy",
      showWhen: true // Always show
    },
    {
      title: "Become a Tutor",
      icon: GraduationCap,
      path: "https://usc.qualtrics.com/jfe/form/SV_7QU9OKorLMDmxNk",
      showWhen: !!user && !profile?.approved_tutor, // Only show for authenticated non-approved tutors
      external: true
    }
  ];

  const filteredItems = sidebarItems.filter(item => item.showWhen);
  
  return (
    <div className="sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white text-usc-cardinal border-r border-gray-200 hidden md:block overflow-y-auto">
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
            
            // Handle external links differently
            if (item.external) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-gray-100",
                    "text-usc-cardinal"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </a>
              );
            }
            
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
