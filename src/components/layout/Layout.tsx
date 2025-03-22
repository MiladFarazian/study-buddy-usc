
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
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex flex-1">
        {!isMobile && <Sidebar />}
        <main className={`flex-1 px-4 md:px-6 lg:px-8 py-6 ${isMobile ? "pb-16" : ""}`}>
          {children}
        </main>
      </div>
      <MobileNavBar />
    </div>
  );
};

export default Layout;
