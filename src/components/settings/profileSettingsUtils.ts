
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";
import { supabase } from "@/integrations/supabase/client";

type ProfileUpdateDto = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];

export const uploadAvatar = async (
  user: any,
  avatarFile: File | null,
  setUploadingAvatar: (value: boolean) => void,
) => {
  if (!user || !avatarFile) return null;
  
  try {
    setUploadingAvatar(true);
    
    // Create a unique file name with the user ID as the folder
    const fileExt = avatarFile.name.split('.').pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // Upload the file to Storage
    const { error: uploadError, data } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, avatarFile, {
        upsert: true,
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  } finally {
    setUploadingAvatar(false);
  }
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
  newAvatarUrl: string | null,
  setLoading: (value: boolean) => void,
  setUploadingAvatar: (value: boolean) => void,
) => {
  if (!user) return { error: "User not authenticated" };

  try {
    setLoading(true);
    
    // First upload the avatar if there is one
    let finalAvatarUrl = newAvatarUrl;
    if (avatarFile) {
      finalAvatarUrl = await uploadAvatar(user, avatarFile, setUploadingAvatar);
      if (!finalAvatarUrl) {
        // If avatar upload failed, don't proceed with profile update
        return { error: "Failed to upload profile picture" };
      }
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

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) return { error: error.message };

    return { data: { ...profile, ...updateData }, error: null };
  } catch (error: any) {
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
