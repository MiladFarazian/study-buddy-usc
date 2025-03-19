
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
