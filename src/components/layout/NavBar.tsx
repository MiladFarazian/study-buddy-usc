
import { Bell, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/auth/UserMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const NavBar = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-gray-200 bg-white w-full">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 mr-6">
            <span className="font-playfair font-bold text-xl">
              <span className="text-usc-cardinal">Study</span>
              <span className="text-usc-gold">Buddy</span>
            </span>
          </Link>
          
          {!isMobile && (
            <div className="relative w-96 hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search for tutors, courses..." />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
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
