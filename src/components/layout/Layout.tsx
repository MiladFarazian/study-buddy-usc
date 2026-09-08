
import { ReactNode, useEffect } from "react";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import MobileNavBar from "./MobileNavBar";
import { SessionBookingWrapper } from "./SessionBookingWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionBooking } from "@/contexts/SessionBookingContext";
import { useLocation } from "react-router-dom";
import SkipToContent from "@/components/a11y/SkipToContent";
import RouteAnnouncer from "@/components/a11y/RouteAnnouncer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const { loading } = useAuth();
  const { showConfirmation } = useSessionBooking();
  const location = useLocation();
  
  // Listen for booking confirmation trigger
  useEffect(() => {
    const confirmationData = localStorage.getItem('showBookingConfirmation');
    
    if (confirmationData) {
      try {
        const details = JSON.parse(confirmationData);
        
        // Show the confirmation popup
        showConfirmation(details);
        
        // Clear the flag
        localStorage.removeItem('showBookingConfirmation');
      } catch (error) {
        console.error('Error showing confirmation:', error);
      }
    }
  }, [location, showConfirmation]);
  
  return (
    <div className="flex flex-col min-h-screen max-w-full">
      <SkipToContent />
      <RouteAnnouncer />
      <NavBar />
      <div className="flex flex-1 w-full pt-16">
        {!isMobile && <Sidebar />}
        <main
          id="main-content"
          // tabIndex -1 makes <main> a focus target for the skip link and for
          // the post-navigation focus move, without adding it to the tab order.
          tabIndex={-1}
          className={`flex-1 ${isMobile ? 'px-3 py-3 pb-20' : 'px-4 md:px-6 lg:px-8 py-6'} overflow-x-hidden focus:outline-none`}
        >
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

