import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";

const adminMenuItems = [
  {
    title: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
];

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-background border-r border-border h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-bold text-primary">Study</span>
          <span className="text-xl font-bold text-secondary">Buddy</span>
        </div>
        
        <nav className="space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};