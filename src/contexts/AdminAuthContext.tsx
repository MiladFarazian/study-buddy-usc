import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdminAuthenticated: false,
  adminLogin: async () => false,
  adminLogout: async () => {},
  loading: false,
});

const ADMIN_EMAIL = "noah@studybuddyusc.com";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email === ADMIN_EMAIL) {
          const adminSession = localStorage.getItem('adminSession');
          if (adminSession === 'true') {
            setIsAdminAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        localStorage.removeItem('adminSession');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    if (email !== ADMIN_EMAIL) {
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user?.email === ADMIN_EMAIL) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('adminSession', 'true');
        return true;
      }
    } catch (error) {
      console.error('Admin login error:', error);
    }
    
    return false;
  };

  const adminLogout = async () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminSession');
    await supabase.auth.signOut();
  };

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated,
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