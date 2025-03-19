
import { supabase } from "@/integrations/supabase/client";

export const uploadAvatar = async (
  user: any,
  avatarFile: File | null,
  supabase: any,
  setUploadingAvatar: (value: boolean) => void,
  onError: (error: any) => void
) => {
  if (!user || !avatarFile) return null;
  
  try {
    setUploadingAvatar(true);
    console.log("Starting avatar upload for user:", user.id);
    
    // Create a unique file name with the user ID as the folder
    const fileExt = avatarFile.name.split('.').pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // Upload the file to Storage
    const { error: uploadError, data } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, avatarFile, {
        upsert: true,
        contentType: avatarFile.type, // Set the correct content type
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
    
    console.log('Image uploaded successfully, public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    onError(error);
    return null;
  } finally {
    setUploadingAvatar(false);
  }
};

export const removeAvatar = async (
  user: any,
  profile: any,
  supabase: any,
  setAvatarUrl: (url: string | null) => void,
  setAvatarFile: (file: File | null) => void,
  setUploadingAvatar: (value: boolean) => void,
  onError: (error: any) => void,
  onSuccess: () => void
) => {
  if (!user || !profile?.avatar_url) return;
  
  try {
    setUploadingAvatar(true);
    
    // Extract the file path from the URL
    const fileUrl = new URL(profile.avatar_url);
    const filePath = fileUrl.pathname.split('/').slice(2).join('/');
    
    // If we can identify the file in storage, try to delete it first
    if (filePath && filePath.includes(user.id)) {
      try {
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([filePath]);
          
        if (deleteError) {
          console.warn('Could not delete file from storage:', deleteError);
          // Continue anyway to remove from profile
        }
      } catch (e) {
        console.warn('Error attempting to delete file:', e);
        // Continue with profile update even if storage delete fails
      }
    }
    
    // Update profile to remove avatar_url
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);
    
    if (error) {
      throw error;
    }
    
    setAvatarUrl(null);
    setAvatarFile(null);
    
    onSuccess();
  } catch (error) {
    console.error('Error removing avatar:', error);
    onError(error);
  } finally {
    setUploadingAvatar(false);
  }
};
