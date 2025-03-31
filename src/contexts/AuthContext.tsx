
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  register: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // This would connect to your authentication service
    // For now, we'll simulate a successful login
    setUser({
      id: '1',
      name: 'John Doe',
      email: email,
      role: 'student'
    });
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    // This would connect to your authentication service
    // For now, we'll simulate a successful registration
    setUser({
      id: '1',
      name: name,
      email: email,
      role: 'student'
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
