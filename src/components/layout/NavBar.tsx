
import { useState, useEffect } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const NavBar = () => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    console.error("Auth context not available:", error);
  }

  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 border-b border-gray-200 bg-white w-full z-50 transition-transform duration-300",
      !isVisible && "translate-y-[-100%]"
    )}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">
              <span className="text-usc-cardinal">Study</span>
              <span className="text-usc-gold">Buddy</span>
            </span>
          </Link>
        </div>

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

          {!isMobile && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default NavBar;

