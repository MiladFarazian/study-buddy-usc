import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ProfilePictureCard } from "./ProfilePictureCard";
import { ProfileForm } from "./ProfileForm";
import { useProfileSettingsState } from "@/hooks/useProfileSettingsState";
import { updateUserProfile, updateUserRole } from "./profileSettingsUtils";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['user_role'];

export const ProfileSettings = () => {
  const { user, profile, isStudent, isTutor, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const {
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
  } = useProfileSettingsState(profile);

  const handleRoleChange = async (role: UserRole) => {
    if (!user) return;
    
    const { error } = await updateUserRole(user, role, setLoading);

    if (error) {
      toast({
        title: "Error",
        description: error || "Failed to update role",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile Updated",
      description: `Your role has been updated to ${role}`,
    });

    setFormData((prev) => ({
      ...prev,
      role,
    }));

    // Update local profile state
    if (updateProfile && profile) {
      updateProfile({
        ...profile,
        role: role as "student" | "tutor",
      });
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    const { data, error } = await updateUserProfile(
      user,
      profile,
      formData,
      avatarFile,
      profile?.avatar_url,
      setLoading,
      setUploadingAvatar
    );

    if (error) {
      toast({
        title: "Error",
        description: error || "Failed to update profile",
        variant: "destructive",
      });
      return;
    }

    // Update local profile state
    if (updateProfile && data) {
      updateProfile(data);
    }
    
    setAvatarFile(null);

    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <ProfileForm
        formData={formData}
        handleInputChange={handleInputChange}
        isStudent={isStudent}
        isTutor={isTutor}
        loading={loading}
        uploadingAvatar={uploadingAvatar}
        handleRoleChange={handleRoleChange}
        handleProfileUpdate={handleProfileUpdate}
        userEmail={user?.email}
      />
      
      <div className="lg:col-span-1">
        <ProfilePictureCard 
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          setAvatarFile={setAvatarFile}
          avatarFile={avatarFile}
          loading={loading}
          uploadingAvatar={uploadingAvatar}
          firstName={formData.first_name}
          userEmail={user?.email}
          setUploadingAvatar={setUploadingAvatar}
        />
      </div>
    </div>
  );
};
