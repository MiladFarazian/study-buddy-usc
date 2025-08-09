
import { Profile } from "@/types/profile";
import { useProfileSettingsState } from "./useProfileSettingsState";

// Unified profile editor hook that reuses the existing settings state
export const useProfileEditor = (profile: Profile | null) => {
  return useProfileSettingsState(profile);
};
