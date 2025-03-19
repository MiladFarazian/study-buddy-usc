
import { useState } from "react";

/**
 * Custom hook to manage profile state
 * This extracts the state management logic from the Profile component
 */
export const useProfileState = (profile: any) => {
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");
  
  // Profile picture states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  return {
    firstName,
    lastName,
    major,
    gradYear,
    bio,
    avatarUrl,
    avatarFile,
    uploadingAvatar,
    setFirstName,
    setLastName,
    setMajor,
    setGradYear,
    setBio,
    setAvatarUrl,
    setAvatarFile,
    setUploadingAvatar
  };
};
