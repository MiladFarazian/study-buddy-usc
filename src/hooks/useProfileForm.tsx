
import { useState, useEffect } from "react";
import { Profile } from "@/types/profile";

export const useProfileForm = (profile: Profile | null) => {
  const [firstName, setFirstName] = useState<string>(profile?.first_name || "");
  const [lastName, setLastName] = useState<string>(profile?.last_name || "");
  const [major, setMajor] = useState<string>(profile?.major || "");
  const [gradYear, setGradYear] = useState<string>(profile?.graduation_year || "");
  const [studentBio, setStudentBio] = useState<string>(profile?.student_bio || "");
  const [tutorBio, setTutorBio] = useState<string>(profile?.tutor_bio || "");
  const [hourlyRate, setHourlyRate] = useState<string>(
    profile?.hourly_rate !== null && profile?.hourly_rate !== undefined
      ? String(profile.hourly_rate)
      : ""
  );

  // Update local state if the profile changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setMajor(profile.major || "");
      setGradYear(profile.graduation_year || "");
      setStudentBio(profile.student_bio || "");
      setTutorBio(profile.tutor_bio || "");
      
      if (profile.hourly_rate !== null && profile.hourly_rate !== undefined) {
        setHourlyRate(String(profile.hourly_rate));
      } else {
        setHourlyRate("");
      }
    }
  }, [profile]);

  // Determine if profile has essential fields filled
  const isProfileComplete = 
    !!firstName && 
    !!lastName && 
    !!major &&
    !!gradYear;

  return {
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
  };
};
