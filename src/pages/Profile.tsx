
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useProfilePage } from "@/hooks/useProfilePage";

const Profile = () => {
  // Redirect to login if not authenticated
  const { user, profile, loading } = useAuthRedirect("/profile", true);
  const { toast } = useToast();
  
  // Use our custom hook for profile state management
  const {
    firstName, lastName, major, gradYear, bio,
    avatarUrl, avatarFile, uploadingAvatar, isSubmitting,
    setFirstName, setLastName, setMajor, setGradYear, setBio,
    setAvatarUrl, setAvatarFile, setUploadingAvatar,
    removeAvatar, handleSubmit
  } = useProfilePage(profile, user);

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
