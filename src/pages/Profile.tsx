
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2, ArrowLeft } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { uploadAvatar } from "@/components/profile/AvatarUtils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfileState } from "@/hooks/useProfileState";

const Profile = () => {
  // Redirect to login if not authenticated
  const { user, profile, loading } = useAuthRedirect("/profile", true);
  const { toast } = useToast();
  
  // Use the custom hook for profile state management
  const { 
    firstName, lastName, major, gradYear, bio,
    avatarUrl, avatarFile, uploadingAvatar,
    setFirstName, setLastName, setMajor, setGradYear, setBio,
    setAvatarUrl, setAvatarFile, setUploadingAvatar
  } = useProfileState(profile);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  }, [profile, setFirstName, setLastName, setMajor, setGradYear, setBio, setAvatarUrl]);

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    try {
      setUploadingAvatar(true);
      
      // Only remove from profile, not from storage
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
        newAvatarUrl = await uploadAvatar(
          user, 
          avatarFile, 
          supabase, 
          setUploadingAvatar,
          (error) => {
            toast({
              title: "Upload failed",
              description: "Failed to upload profile picture. Please try again.",
              variant: "destructive",
            });
          }
        );
      }
      
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
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>
      
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
            setUploadingAvatar={setUploadingAvatar}
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
