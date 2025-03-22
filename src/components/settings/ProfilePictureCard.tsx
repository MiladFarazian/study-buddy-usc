
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropper } from "@/components/ui/image-cropper";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { AvatarActions } from "@/components/profile/AvatarActions";
import { removeAvatar } from "@/components/profile/AvatarUtils";

interface ProfilePictureCardProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAvatarFile: (file: File | null) => void;
  avatarFile: File | null;
  loading: boolean;
  uploadingAvatar: boolean;
  firstName: string;
  userEmail?: string;
  setUploadingAvatar?: (value: boolean) => void;
}

export const ProfilePictureCard = ({
  avatarUrl,
  setAvatarUrl,
  setAvatarFile,
  avatarFile,
  loading,
  uploadingAvatar,
  firstName,
  userEmail,
  setUploadingAvatar = () => {},
}: ProfilePictureCardProps) => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [showCropper, setShowCropper] = useState(false);
  const [cropperFile, setCropperFile] = useState<File | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB max for original file
        toast({
          title: "File too large",
          description: "Please select an image less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      // Show cropper instead of direct preview
      setCropperFile(file);
      setShowCropper(true);
      console.log("File selected for cropping:", file.name);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file for upload
    const file = new File([croppedBlob], cropperFile?.name || "profile.jpg", {
      type: "image/jpeg",
    });
    
    console.log("Crop completed, file size:", file.size);
    
    // Preview the cropped image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarUrl(e.target.result as string);
        console.log("Profile picture preview set from crop");
      }
    };
    reader.readAsDataURL(croppedBlob);
    
    setAvatarFile(file);
    setShowCropper(false);
    setCropperFile(null);
    
    toast({
      title: "Image cropped",
      description: "Your profile picture has been cropped successfully. Don't forget to save your profile to upload it.",
    });
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setCropperFile(null);
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    await removeAvatar(
      user,
      profile,
      supabase,
      setAvatarUrl,
      setAvatarFile,
      setUploadingAvatar,
      (error) => {
        toast({
          title: "Remove failed",
          description: "Failed to remove profile picture. Please try again.",
          variant: "destructive",
        });
      },
      () => {
        // Update local profile state
        if (updateProfile) {
          updateProfile({
            ...profile,
            avatar_url: null,
          });
        }
        
        toast({
          title: "Profile picture removed",
          description: "Your profile picture has been removed",
        });
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile photo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <AvatarDisplay
              avatarUrl={avatarUrl}
              userEmail={userEmail}
              firstName={firstName}
              lastName={profile?.last_name || ""}
            />
          </div>
          
          <AvatarActions
            avatarUrl={avatarUrl}
            avatarFile={avatarFile}
            uploadingAvatar={uploadingAvatar}
            isSubmitting={loading}
            onFileChange={handleAvatarFileChange}
            onRemove={handleRemoveAvatar}
          />
        </CardContent>
      </Card>

      <ImageCropper
        imageFile={cropperFile}
        onCropComplete={handleCropComplete}
        onCancel={cancelCrop}
        isOpen={showCropper}
      />
    </>
  );
};
