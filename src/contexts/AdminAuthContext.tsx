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
    const validateAdminSession = async () => {
      const adminSession = localStorage.getItem('adminSession');
      
      if (adminSession === 'true') {
        // Validate that Supabase session is still active
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          // Valid session exists, user is still authenticated
          setIsAdmin(true);
        } else {
          // Session is invalid, clear localStorage and force re-authentication
          console.log('Admin session expired, clearing localStorage');
          localStorage.removeItem('adminSession');
          setIsAdmin(false);
        }
      }
      
      setLoading(false);
    };

    validateAdminSession();
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