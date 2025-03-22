
import { useState, useEffect } from "react";

export const useProfileForm = (profile: any) => {
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");

  // Update form state when profile data changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setMajor(profile.major || "");
      setGradYear(profile.graduation_year || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  // Add this calculation
  const isProfileComplete = profile && 
    profile.first_name && 
    profile.last_name && 
    profile.major && 
    profile.bio;

  return {
    firstName,
    lastName,
    major,
    gradYear,
    bio,
    setFirstName,
    setLastName,
    setMajor,
    setGradYear,
    setBio,
    isProfileComplete
  };
};
