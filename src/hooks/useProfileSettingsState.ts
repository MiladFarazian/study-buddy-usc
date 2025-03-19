
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { Profile } from "@/integrations/supabase/types-extension";

type UserRole = Database['public']['Enums']['user_role'];

export const useProfileSettingsState = (profile: Profile | null) => {
  const [loading, setLoading] = useState(false);
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

  // Profile picture states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    handleInputChange
  };
};
