
import { Profile } from "@/integrations/supabase/types-extension";
import { useProfileForm } from "./useProfileForm";
import { useProfileAvatar } from "./useProfileAvatar";
import { useLoadingState } from "./useLoadingState";
import { useState } from "react";

export const useProfileSettingsState = (profile: Profile | null) => {
  const { loading, setLoading } = useLoadingState();
  const { 
    firstName, 
    lastName, 
    major, 
    gradYear, 
    bio, 
    hourlyRate,
    setFirstName,
    setLastName,
    setMajor,
    setGradYear,
    setBio,
    setHourlyRate,
    isProfileComplete
  } = useProfileForm(profile);
  
  const { 
    avatarUrl, 
    setAvatarUrl, 
    uploadingAvatar, 
    setUploadingAvatar, 
    avatarFile, 
    setAvatarFile 
  } = useProfileAvatar(profile);

  // Create a formData object that matches what ProfileSettings expects
  const formData = {
    first_name: firstName,
    last_name: lastName,
    major: major,
    graduation_year: gradYear,
    bio: bio,
    role: profile?.role || "student",
    hourly_rate: hourlyRate,
    subjects: profile?.subjects || [] as string[]
  };

  // Create a setFormData function
  const setFormData = (newFormData: any) => {
    if (typeof newFormData === 'function') {
      const updatedData = newFormData(formData);
      setFirstName(updatedData.first_name);
      setLastName(updatedData.last_name);
      setMajor(updatedData.major);
      setGradYear(updatedData.graduation_year);
      setBio(updatedData.bio);
      setHourlyRate(updatedData.hourly_rate);
    } else {
      setFirstName(newFormData.first_name);
      setLastName(newFormData.last_name);
      setMajor(newFormData.major);
      setGradYear(newFormData.graduation_year);
      setBio(newFormData.bio);
      setHourlyRate(newFormData.hourly_rate);
    }
  };

  // Create a handleInputChange function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case "first_name":
        setFirstName(value);
        break;
      case "last_name":
        setLastName(value);
        break;
      case "major":
        setMajor(value);
        break;
      case "graduation_year":
        setGradYear(value);
        break;
      case "bio":
        setBio(value);
        break;
      case "hourly_rate":
        setHourlyRate(value);
        break;
      default:
        // For other fields, we'll update the formData directly
        break;
    }
  };

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
    handleInputChange,
    isProfileComplete
  };
};
