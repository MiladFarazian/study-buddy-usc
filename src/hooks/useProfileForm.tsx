
import { useState, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";

type UserRole = Database['public']['Enums']['user_role'];

export const useProfileForm = (profile: Profile | null) => {
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [hourlyRate, setHourlyRate] = useState(
    // Ensure hourlyRate is a string, even if null or undefined
    profile?.hourly_rate ? profile.hourly_rate.toString() : ""
  );

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("Profile hourly rate in useProfileForm:", {
      profileHourlyRate: profile?.hourly_rate,
      stateHourlyRate: hourlyRate
    });
  }, [profile?.hourly_rate, hourlyRate]);

  const isProfileComplete = Boolean(
    firstName && lastName && major && bio
  );

  return {
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
  };
};

export const useProfileFormState = (profile: Profile | null) => {
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    major: profile?.major || "",
    graduation_year: profile?.graduation_year || "",
    bio: profile?.bio || "",
    role: profile?.role || "student" as UserRole,
    hourly_rate: profile?.hourly_rate ? profile.hourly_rate.toString() : "",
    subjects: profile?.subjects || [] as string[],
  });

  // Debug logging to track formData changes
  useEffect(() => {
    console.log("FormData in useProfileFormState:", {
      hourly_rate: formData.hourly_rate,
      profileHourlyRate: profile?.hourly_rate
    });
  }, [formData.hourly_rate, profile?.hourly_rate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`ProfileFormState input changed: ${name} = ${value}`);
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      console.log(`Updated form data for ${name}:`, updated);
      return updated;
    });
  };

  return {
    formData,
    setFormData,
    handleInputChange
  };
};
