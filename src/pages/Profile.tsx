
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";

const Profile = () => {
  // Redirect to login if not authenticated
  const { user, profile, loading, updateProfile } = useAuthRedirect("/profile", true);
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Profile picture states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Update form state when profile data changes
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setMajor(profile.major || "");
      setGradYear(profile.graduation_year || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return null;
    
    try {
      setUploadingAvatar(true);
      
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Create a unique file name with the user ID as the folder
      const fileExt = avatarFile.name.split('.').pop() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload the file to Storage
      const { error: uploadError, data } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, avatarFile, {
          upsert: true,
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    try {
      setUploadingAvatar(true);
      
      // Only remove from profile, not from storage
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setAvatarUrl(null);
      setAvatarFile(null);
      
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be signed in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First upload the avatar if there is one
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }
      
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          major,
          graduation_year: gradYear,
          bio,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local profile state through auth context
      if (updateProfile) {
        updateProfile({
          ...profile,
          first_name: firstName,
          last_name: lastName,
          major,
          graduation_year: gradYear,
          bio,
          avatar_url: newAvatarUrl,
        });
      }
      
      setAvatarFile(null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-usc-cardinal" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null; // will be redirected by useAuthRedirect

  return (
    <div className="container py-8">
      <ProfileHeader title="Your Profile" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ProfileAvatar 
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            setAvatarFile={setAvatarFile}
            avatarFile={avatarFile}
            userEmail={user.email}
            firstName={firstName}
            lastName={lastName}
            isSubmitting={isSubmitting}
            uploadingAvatar={uploadingAvatar}
            removeAvatar={removeAvatar}
            userRole={profile?.role}
            profile={profile}
          />
        </div>
        
        <div className="md:col-span-2">
          <ProfileForm 
            firstName={firstName}
            lastName={lastName}
            major={major}
            gradYear={gradYear}
            bio={bio}
            isSubmitting={isSubmitting}
            uploadingAvatar={uploadingAvatar}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onMajorChange={setMajor}
            onGradYearChange={setGradYear}
            onBioChange={setBio}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
