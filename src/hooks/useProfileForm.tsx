
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";

type UserRole = Database['public']['Enums']['user_role'];

export const useProfileFormState = (profile: Profile | null) => {
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    major: profile?.major || "",
    graduation_year: profile?.graduation_year || "",
    bio: profile?.bio || "",
    role: profile?.role || "student" as UserRole,
    hourly_rate: profile?.hourly_rate?.toString() || "",
    subjects: profile?.subjects || [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return {
    formData,
    setFormData,
    handleInputChange
  };
};
