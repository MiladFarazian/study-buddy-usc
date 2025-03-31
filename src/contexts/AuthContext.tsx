
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profile } from './types/auth-types';

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
  profile: Profile | null;
  loading: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isProfileComplete: boolean;
  updateProfile: (updatedProfile: Partial<Profile>) => void;
  signIn: (provider: 'google') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  session: null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  profile: null,
  loading: false,
  isStudent: false,
  isTutor: false,
  isProfileComplete: false,
  updateProfile: () => {},
  signIn: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  session: null
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

  const updateProfile = (updatedProfile: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedProfile });
    }
  };

  const signIn = async (provider: 'google') => {
    // Simulate sign in with Google
    setUser({
      id: '1',
      name: 'Google User',
      email: 'google-user@example.com',
      role: 'student'
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Simulate email sign in
      setUser({
        id: '1',
        name: 'Email User',
        email: email,
        role: 'student'
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Simulate sign up
      setUser({
        id: '1',
        name: 'New User',
        email: email,
        role: 'student'
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
  };

  // Calculate derived states
  const isStudent = profile?.role === 'student';
  const isTutor = profile?.role === 'tutor';
  const isProfileComplete = !!profile && !!profile.first_name && !!profile.last_name;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register,
        profile,
        loading,
        isStudent,
        isTutor,
        isProfileComplete,
        updateProfile,
        signIn,
        signInWithEmail,
        signUp,
        signOut,
        session: null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
