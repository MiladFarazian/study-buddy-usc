import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

type ViewMode = 'student' | 'tutor';

interface ViewModeContextType {
  viewMode: ViewMode;
  isTutorView: boolean;
  isStudentView: boolean;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem('profileView');
    return (stored === 'tutor' || stored === 'student') ? stored : 'student';
  });

  // Force student view if not an approved tutor
  useEffect(() => {
    if (profile && !profile.approved_tutor && viewMode === 'tutor') {
      setViewModeState('student');
      localStorage.setItem('profileView', 'student');
    }
  }, [profile, viewMode]);

  const setViewMode = (mode: ViewMode) => {
    // Prevent switching to tutor view if not approved
    if (mode === 'tutor' && (!profile || !profile.approved_tutor)) {
      return;
    }
    setViewModeState(mode);
    localStorage.setItem('profileView', mode);
  };

  const value: ViewModeContextType = {
    viewMode,
    isTutorView: viewMode === 'tutor',
    isStudentView: viewMode === 'student',
    setViewMode,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
