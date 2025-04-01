
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import MobileNavBar from "./MobileNavBar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen max-w-full overflow-hidden">
      <NavBar />
      <div className="flex flex-1 w-full overflow-hidden">
        {!isMobile && <Sidebar />}
        <main className={`flex-1 ${isMobile ? 'px-3 py-3 pb-20' : 'px-4 md:px-6 lg:px-8 py-6'} overflow-x-hidden`}>
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      <MobileNavBar />
    </div>
  );
};

export default Layout;
