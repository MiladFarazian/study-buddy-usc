
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfileForm } from "./useProfileForm";
import { useAvatarOperations } from "./useAvatarOperations";
import { useProfileSubmission } from "./useProfileSubmission";

export const useProfilePage = (profile: any, user: any) => {
  const { toast } = useToast();
  
  // Use our custom hooks for different aspects of profile management
  const {
    firstName, lastName, major, gradYear, bio,
    setFirstName, setLastName, setMajor, setGradYear, setBio,
    isProfileComplete
  } = useProfileForm(profile);
  
  const {
    avatarUrl, avatarFile, uploadingAvatar,
    setAvatarUrl, setAvatarFile, setUploadingAvatar, removeAvatar
  } = useAvatarOperations(user, profile);
  
  const { isSubmitting, handleSubmit: submitProfile } = useProfileSubmission(
    user, profile, avatarFile, setUploadingAvatar, setAvatarFile
  );

  // Debug output
  useEffect(() => {
    console.log("Profile loaded:", profile);
    console.log("Current avatar URL:", avatarUrl);
  }, [profile, avatarUrl]);

  // Wrapper for the form submission
  const handleSubmit = (e: React.FormEvent) => {
    submitProfile(e, {
      firstName,
      lastName,
      major,
      gradYear,
      bio
    });
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
    handleSubmit,
    isProfileComplete
  };
};
