
import { useState } from "react";
import { Bell, Menu, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

const NavBar = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white w-full">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">
              <span className="text-usc-cardinal">Study</span>
              <span className="text-usc-gold">Buddy</span>
            </span>
          </Link>
        </div>

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        )}

        <div className="flex items-center gap-4">
          {user && (
            <>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default NavBar;
