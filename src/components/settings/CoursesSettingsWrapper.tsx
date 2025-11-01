import { useViewMode } from "@/contexts/ViewModeContext";
import { CoursesSettings } from "./CoursesSettings";

export function CoursesSettingsWrapper() {
  const { viewMode } = useViewMode();

  return <CoursesSettings profileView={viewMode} />;
}
