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
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar = () => {
  const location = useLocation();
  const { isStudent, isTutor, user } = useAuth();
  const isMobile = useIsMobile();
  
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
      showWhen: isStudent || !user // Show for students or unauthenticated
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
      title: "Payments",
      icon: CreditCard,
      path: "/settings?tab=payments",
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
        {filteredItems.map((item) => {
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
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
