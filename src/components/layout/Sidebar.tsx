
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart, 
  BookOpen, 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  Users 
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/"
  },
  {
    title: "Courses",
    icon: BookOpen,
    path: "/courses"
  },
  {
    title: "Tutors",
    icon: Users,
    path: "/tutors"
  },
  {
    title: "Schedule",
    icon: Calendar,
    path: "/schedule"
  },
  {
    title: "Resources",
    icon: FileText,
    path: "/resources"
  },
  {
    title: "Analytics",
    icon: BarChart,
    path: "/analytics"
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings"
  }
];

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen w-64 bg-white text-usc-cardinal border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Study<span className="text-usc-gold">Buddy</span></span>
        </Link>
      </div>
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.path;
          
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
