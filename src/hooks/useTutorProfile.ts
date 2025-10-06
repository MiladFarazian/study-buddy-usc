import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types/profile";
import { updateUserProfile } from "@/components/settings/profileSettingsUtils";
import { useAuth } from "@/contexts/AuthContext";

export const useTutorProfile = (profile: Profile | null) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    major: "",
    graduation_year: "",
    tutor_bio: "",
    hourly_rate: "",
  });

  const [tutorData, setTutorData] = useState<any>(null);

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        major: profile.major || "",
        graduation_year: profile.graduation_year || "",
        tutor_bio: profile.tutor_bio || "",
        hourly_rate: profile.hourly_rate?.toString() || "",
      });
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Fetch tutor-specific data
  useEffect(() => {
    const fetchTutorData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching tutor data:', error);
        } else if (data) {
          setTutorData(data);
        }
      } catch (error) {
        console.error('Error fetching tutor data:', error);
      }
    };

    if (profile?.approved_tutor) {
      fetchTutorData();
    }
  }, [user?.id, profile?.approved_tutor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async () => {
    if (!user || !profile) return;

    const { data, error } = await updateUserProfile(
      user,
      profile,
      {
        ...formData,
        student_bio: profile?.student_bio || "",
      },
      avatarFile,
      profile?.avatar_url,
      setLoading,
      setUploadingAvatar,
      true // isTutor
    );

    if (error) {
      toast({ title: "Error", description: error || "Failed to update profile", variant: "destructive" });
      return;
    }

    // Update or create tutor record
    if (user.id) {
      const tutorRecord = {
        profile_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.tutor_bio,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        approved_tutor: profile.approved_tutor || false,
      };

      const { error: tutorError } = await supabase
        .from('tutors')
        .upsert(tutorRecord, { onConflict: 'profile_id' });

      if (tutorError) {
        console.error('Error updating tutor record:', tutorError);
        toast({ title: "Warning", description: "Profile updated but tutor data sync failed", variant: "destructive" });
      }
    }

    if (updateProfile && data) updateProfile(data);
    setAvatarFile(null);
    toast({ title: "Profile Updated", description: "Your tutor profile has been successfully updated" });
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
    handleProfileUpdate,
    tutorData,
  };
};