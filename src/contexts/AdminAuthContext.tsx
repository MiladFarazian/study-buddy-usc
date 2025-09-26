import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthContextType {
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  adminLogin: async () => false,
  adminLogout: () => {},
  loading: false,
});

const ADMIN_CREDENTIALS = {
  email: "noah@studybuddyusc.com",
  password: "StudyBuddy9!"
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      // Check both localStorage AND Supabase session
      const adminSession = localStorage.getItem('adminSession');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (adminSession === 'true' && session?.user?.email === ADMIN_CREDENTIALS.email) {
        setIsAdmin(true);
      } else {
        // Clear localStorage if Supabase session is invalid
        localStorage.removeItem('adminSession');
        setIsAdmin(false);
      }
      setLoading(false);
    };
    
    checkAuthState();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      // Sign in to Supabase to get proper authenticated session
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        setIsAdmin(true);
        localStorage.setItem('adminSession', 'true');
        return true;
      }
    }
    return false;
  };

  const adminLogout = async () => {
    setIsAdmin(false);
    localStorage.removeItem('adminSession');
    await supabase.auth.signOut();
  };

  return (
    <AdminAuthContext.Provider value={{
      isAdmin,
      adminLogin,
      adminLogout,
      loading,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};