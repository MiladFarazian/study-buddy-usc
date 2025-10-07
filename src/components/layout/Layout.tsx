
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import MobileNavBar from "./MobileNavBar";
import { SessionBookingWrapper } from "./SessionBookingWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const { loading } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen max-w-full">
      <NavBar />
      <div className="flex flex-1 w-full pt-16">
        {!isMobile && <Sidebar />}
        <main className={`flex-1 ${isMobile ? 'px-3 py-3 pb-20' : 'px-4 md:px-6 lg:px-8 py-6'} overflow-x-hidden`}>
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      {isMobile && <MobileNavBar />}
      <SessionBookingWrapper />
    </div>
  );
};

export default Layout;

