
import { useState, useEffect } from "react";
import { Profile } from "@/integrations/supabase/types-extension";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useProfilePage = (profile: Profile | null, user: any) => {
  const { toast } = useToast();
  
  // Form state
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form state when profile data changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setMajor(profile.major || "");
      setGradYear(profile.graduation_year || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    try {
      setUploadingAvatar(true);
      
      // Only remove from profile, not from storage
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    try {
      // First upload the avatar if there is one
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(
          user, 
          avatarFile, 
          supabase, 
          setUploadingAvatar,
          (error) => {
            toast({
              title: "Upload failed",
              description: "Failed to upload profile picture. Please try again.",
              variant: "destructive",
            });
          }
        );
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          major,
          graduation_year: gradYear,
          bio,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setAvatarFile(null);
      
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
    firstName,
    lastName,
    major,
    gradYear,
    bio,
    avatarUrl,
    avatarFile,
    uploadingAvatar,
    isSubmitting,
    setFirstName,
    setLastName,
    setMajor,
    setGradYear,
    setBio,
    setAvatarUrl,
    setAvatarFile,
    setUploadingAvatar,
    removeAvatar,
    handleSubmit
  };
};

import { uploadAvatar } from "@/components/profile/AvatarUtils";
