
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <NavBar />
        <main className="flex-1 container px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
