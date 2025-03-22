
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadAvatar } from "@/components/profile/AvatarUtils";

export const useAvatarOperations = (user: any, profile: any) => {
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const removeAvatar = async () => {
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
      
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    avatarUrl,
    avatarFile,
    uploadingAvatar,
    setAvatarUrl,
    setAvatarFile,
    setUploadingAvatar,
    removeAvatar
  };
};
