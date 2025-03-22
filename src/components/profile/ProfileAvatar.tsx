
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/ui/image-cropper";
import { AvatarDisplay } from "./AvatarDisplay";
import { AvatarActions } from "./AvatarActions";
import { ProfileInfo } from "./ProfileInfo";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAvatarFile: (file: File | null) => void;
  avatarFile: File | null;
  userEmail: string | undefined;
  firstName: string;
  lastName: string;
  isSubmitting: boolean;
  uploadingAvatar: boolean;
  setUploadingAvatar: (value: boolean) => void;
  removeAvatar: () => Promise<void>;
  userRole?: string;
  profile?: any;
}

export const ProfileAvatar = ({
  avatarUrl,
  setAvatarUrl,
  setAvatarFile,
  avatarFile,
  userEmail,
  firstName,
  lastName,
  isSubmitting,
  uploadingAvatar,
  setUploadingAvatar,
  removeAvatar,
  userRole,
  profile
}: ProfileAvatarProps) => {
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
        console.log("Preview image set from crop");
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
  
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <AvatarDisplay
                avatarUrl={avatarUrl}
                userEmail={userEmail}
                firstName={firstName}
                lastName={lastName}
              />
              
              <AvatarActions
                avatarUrl={avatarUrl}
                avatarFile={avatarFile}
                uploadingAvatar={uploadingAvatar}
                isSubmitting={isSubmitting}
                onFileChange={handleAvatarFileChange}
                onRemove={removeAvatar}
              />
            </div>
            
            <ProfileInfo
              firstName={firstName}
              lastName={lastName}
              userEmail={userEmail}
              userRole={userRole}
              profile={profile}
            />
          </div>
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
