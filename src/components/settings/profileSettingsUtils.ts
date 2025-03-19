
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";
import { supabase } from "@/integrations/supabase/client";
import { uploadAvatar as uploadAvatarUtil } from "@/components/profile/AvatarUtils";

type ProfileUpdateDto = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];

export const uploadAvatar = async (
  user: any,
  avatarFile: File | null,
  setUploadingAvatar: (value: boolean) => void,
) => {
  if (!user || !avatarFile) return null;
  
  return uploadAvatarUtil(
    user, 
    avatarFile, 
    supabase, 
    setUploadingAvatar, 
    (error) => {
      console.error('Error uploading avatar in settings:', error);
    }
  );
};

export const updateUserProfile = async (
  user: any,
  profile: Profile | null,
  formData: {
    first_name: string;
    last_name: string;
    major: string;
    graduation_year: string;
    bio: string;
    role: UserRole;
    hourly_rate: string;
  },
  avatarFile: File | null,
  currentAvatarUrl: string | null,
  setLoading: (value: boolean) => void,
  setUploadingAvatar: (value: boolean) => void,
) => {
  if (!user) return { error: "User not authenticated" };

  try {
    setLoading(true);
    
    // First upload the avatar if there is one
    let finalAvatarUrl = currentAvatarUrl;
    if (avatarFile) {
      console.log("Settings: Uploading avatar file", avatarFile.name);
      finalAvatarUrl = await uploadAvatar(user, avatarFile, setUploadingAvatar);
      if (!finalAvatarUrl) {
        console.error("Failed to upload profile picture in settings");
        return { error: "Failed to upload profile picture" };
      }
      console.log("Settings: Avatar uploaded successfully", finalAvatarUrl);
    }
    
    const updateData: ProfileUpdateDto = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      major: formData.major,
      graduation_year: formData.graduation_year,
      bio: formData.bio,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    };
    
    if (formData.role === 'tutor' && formData.hourly_rate) {
      updateData.hourly_rate = parseFloat(formData.hourly_rate);
    }

    console.log("Settings: Updating profile with data", updateData);
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error("Settings: Error updating profile", error);
      return { error: error.message };
    }

    console.log("Settings: Profile updated successfully");
    return { data: { ...profile, ...updateData }, error: null };
  } catch (error: any) {
    console.error("Settings: Unexpected error updating profile", error);
    return { error: error.message || "An error occurred" };
  } finally {
    setLoading(false);
  }
};

export const updateUserRole = async (
  user: any, 
  role: UserRole,
  setLoading: (value: boolean) => void
) => {
  if (!user) return { error: "User not authenticated" };
  
  try {
    setLoading(true);
    
    const updateData: ProfileUpdateDto = { role };
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) return { error: error.message };

    return { data: { role }, error: null };
  } catch (error: any) {
    return { error: error.message || "An error occurred" };
  } finally {
    setLoading(false);
  }
};
