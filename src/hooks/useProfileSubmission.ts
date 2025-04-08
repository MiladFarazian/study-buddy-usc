
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadAvatar } from "@/components/profile/AvatarUtils";
import { Profile } from "@/types/profile";

export const useProfileSubmission = (
  user: any, 
  profile: any,
  avatarFile: File | null,
  setUploadingAvatar: (value: boolean) => void,
  setAvatarFile: (file: File | null) => void,
  updateProfileContext?: (profile: Partial<Profile>) => void
) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, formData: {
    firstName: string,
    lastName: string,
    major: string,
    gradYear: string,
    bio: string,
    subjects?: string[]
  }) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be signed in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    console.log("Starting profile update...");
    
    try {
      // First upload the avatar if there is one
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        console.log("Uploading avatar file:", avatarFile.name);
        newAvatarUrl = await uploadAvatar(
          user, 
          avatarFile, 
          supabase, 
          setUploadingAvatar,
          (error) => {
            console.error("Avatar upload error:", error);
            toast({
              title: "Upload failed",
              description: "Failed to upload profile picture. Please try again.",
              variant: "destructive",
            });
          }
        );
        
        console.log("Avatar upload completed, new URL:", newAvatarUrl);
      }
      
      // Preserve the existing subjects if they exist and no new ones provided
      const subjects = formData.subjects || profile?.subjects || [];
      
      const updatedProfileData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        major: formData.major,
        graduation_year: formData.gradYear,
        bio: formData.bio,
        avatar_url: newAvatarUrl,
        subjects: subjects,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user.id);
      
      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }
      
      console.log("Profile updated successfully");
      setAvatarFile(null);
      
      // Update global auth context if the function is provided
      if (updateProfileContext) {
        updateProfileContext(updatedProfileData);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
