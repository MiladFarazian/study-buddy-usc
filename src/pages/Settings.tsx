
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const Settings = () => {
  const { loading, profile, isTutor } = useAuthRedirect('/settings', true);
  const location = useLocation();
  
  // Check for debug mode
  const showDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'session';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isActiveTab = (path: string) => location.pathname === `/settings/${path}`;

  return (
    <div className="container max-w-6xl py-6 md:py-10">
      <div className="space-y-0.5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <nav className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
          <NavLink 
            to="/settings/profile" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Profile
          </NavLink>
          
          <NavLink 
            to="/settings/referrals" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Referrals
          </NavLink>
          
          <NavLink 
            to="/settings/account"
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Account
          </NavLink>
          
          <NavLink 
            to="/settings/courses" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            My Courses
          </NavLink>


          {isTutor && (
            <NavLink 
              to="/settings/availability" 
              className={({ isActive }) => 
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`
              }
            >
              Availability
            </NavLink>
          )}

          {isTutor && (
            <NavLink 
              to="/settings/tutor-settings" 
              className={({ isActive }) => 
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`
              }
            >
              Tutor Settings
            </NavLink>
          )}

          <NavLink 
            to="/settings/notifications" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Notifications
          </NavLink>

          <NavLink 
            to="/settings/payment" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Payment
          </NavLink>

          <NavLink 
            to="/settings/privacy" 
            className={({ isActive }) => 
              `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`
            }
          >
            Privacy
          </NavLink>
        </nav>
        
        <div className="space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Settings;
