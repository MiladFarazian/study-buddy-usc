import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types/profile";
import { updateUserProfile } from "@/components/settings/profileSettingsUtils";
import { useAuth } from "@/contexts/AuthContext";

export const useStudentProfile = (profile: Profile | null) => {
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
    student_bio: "",
  });

  const [studentData, setStudentData] = useState<any>(null);

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        major: profile.major || "",
        graduation_year: profile.graduation_year || "",
        student_bio: profile.student_bio || "",
      });
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Fetch student-specific data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching student data:', error);
        } else if (data) {
          setStudentData(data);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    if (profile?.role === 'student') {
      fetchStudentData();
    }
  }, [user?.id, profile?.role]);

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
        tutor_bio: profile?.tutor_bio || "",
        hourly_rate: profile?.hourly_rate?.toString() || "",
        role: 'student'
      },
      avatarFile,
      profile?.avatar_url,
      setLoading,
      setUploadingAvatar
    );

    if (error) {
      toast({ title: "Error", description: error || "Failed to update profile", variant: "destructive" });
      return;
    }

    // Update or create student record
    if (user.id) {
      const studentRecord = {
        profile_id: user.id,
        bio: formData.student_bio,
        courses: profile.student_courses || [],
      };

      const { error: studentError } = await supabase
        .from('students')
        .upsert(studentRecord, { onConflict: 'profile_id' });

      if (studentError) {
        console.error('Error updating student record:', studentError);
        toast({ title: "Warning", description: "Profile updated but student data sync failed", variant: "destructive" });
      }
    }

    if (updateProfile && data) updateProfile(data);
    setAvatarFile(null);
    toast({ title: "Profile Updated", description: "Your student profile has been successfully updated" });
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
    studentData,
  };
};