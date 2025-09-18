import { Profile } from "@/types/profile";
import { useProfileForm } from "./useProfileForm";
import { useProfileAvatar } from "./useProfileAvatar";
import { useLoadingState } from "./useLoadingState";
import { useEffect } from "react";

export const useProfileSettingsState = (profile: Profile | null) => {
  const { loading, setLoading } = useLoadingState();
  const {
    firstName,
    lastName,
    major,
    gradYear,
    studentBio,
    tutorBio,
    hourlyRate,
    setFirstName,
    setLastName,
    setMajor,
    setGradYear,
    setStudentBio,
    setTutorBio,
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

  // Debug logging
  useEffect(() => {
    console.log("ProfileSettingsState - hourlyRate:", hourlyRate);
    console.log("ProfileSettingsState - profile hourly_rate:", profile?.hourly_rate);
  }, [hourlyRate, profile?.hourly_rate]);

  // Create form data object
  const formData = {
    first_name: firstName,
    last_name: lastName,
    major,
    graduation_year: gradYear,
    student_bio: studentBio,
    tutor_bio: tutorBio,
    hourly_rate: hourlyRate,
    role: profile?.role || "student" as any,
    avatarUrl,
    currentAvatarUrl: profile?.avatar_url || null
  };

  // Create a setFormData function
  const setFormData = (newFormData: any) => {
    if (typeof newFormData === 'function') {
      const updatedData = newFormData(formData);
      setFirstName(updatedData.first_name);
      setLastName(updatedData.last_name);
      setMajor(updatedData.major);
      setGradYear(updatedData.graduation_year);
      setStudentBio(updatedData.student_bio);
      setTutorBio(updatedData.tutor_bio);
      setHourlyRate(updatedData.hourly_rate);
    } else {
      setFirstName(newFormData.first_name);
      setLastName(newFormData.last_name);
      setMajor(newFormData.major);
      setGradYear(newFormData.graduation_year);
      setStudentBio(newFormData.student_bio);
      setTutorBio(newFormData.tutor_bio);
      setHourlyRate(newFormData.hourly_rate);
    }
  };

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
      case "studentBio":
        setStudentBio(value);
        break;
      case "tutorBio":
        setTutorBio(value);
        break;
      case "hourly_rate":
        setHourlyRate(value);
        break;
      default:
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