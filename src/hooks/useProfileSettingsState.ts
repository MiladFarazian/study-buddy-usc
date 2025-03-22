
import { Profile } from "@/integrations/supabase/types-extension";
import { useProfileFormState } from "./useProfileForm";
import { useProfileAvatar } from "./useProfileAvatar";
import { useLoadingState } from "./useLoadingState";

export const useProfileSettingsState = (profile: Profile | null) => {
  const { loading, setLoading } = useLoadingState();
  const { formData, setFormData, handleInputChange } = useProfileFormState(profile);
  const { 
    avatarUrl, 
    setAvatarUrl, 
    uploadingAvatar, 
    setUploadingAvatar, 
    avatarFile, 
    setAvatarFile 
  } = useProfileAvatar(profile);

  return {
    loading,
    setLoading,
    formData,
    setFormData,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    avatarFile,
    setAvatarFile,
    handleInputChange
  };
};
