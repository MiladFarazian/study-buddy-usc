
import { useToast } from "@/hooks/use-toast";

export const uploadAvatar = async (
  user: any,
  avatarFile: File | null,
  supabase: any,
  setUploadingAvatar: (value: boolean) => void
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
    const { toast } = useToast();
    toast({
      title: "Upload failed",
      description: "Failed to upload profile picture. Please try again.",
      variant: "destructive",
    });
    return null;
  } finally {
    setUploadingAvatar(false);
  }
};
