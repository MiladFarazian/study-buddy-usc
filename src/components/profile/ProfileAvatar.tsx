
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { ImageCropper } from "@/components/ui/image-cropper";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { removeAvatar } from "./AvatarUtils";

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
  userRole,
  profile
}: ProfileAvatarProps) => {
  const { toast } = useToast();
  const { user, updateProfile } = useAuth();
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
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file for upload
    const file = new File([croppedBlob], cropperFile?.name || "profile.jpg", {
      type: "image/jpeg",
    });
    
    // Preview the cropped image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(croppedBlob);
    
    setAvatarFile(file);
    setShowCropper(false);
    setCropperFile(null);
    
    toast({
      title: "Image cropped",
      description: "Your profile picture has been cropped successfully",
    });
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setCropperFile(null);
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    
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
        if (updateProfile && profile) {
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

  const getInitials = (name: string = userEmail || "") => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={avatarUrl || ""} alt={userEmail || ""} />
                <AvatarFallback className="bg-usc-cardinal text-white text-xl">
                  {getInitials(userEmail || "")}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="relative">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    disabled={uploadingAvatar || isSubmitting}
                  >
                    <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
                      <Upload className="mr-2 h-4 w-4" />
                      {avatarFile ? "Change Image" : "Upload Image"}
                    </label>
                  </Button>
                </div>
                
                {avatarUrl && (
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar || isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mt-4">
              {firstName && lastName ? `${firstName} ${lastName}` : userEmail}
            </h2>
            <p className="text-muted-foreground">{userRole || "Student"}</p>
            
            <div className="w-full mt-6">
              <div className="p-3 border rounded-md mb-3">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userEmail}</p>
              </div>
              
              {userRole === "tutor" && (
                <>
                  <div className="p-3 border rounded-md mb-3">
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-medium">{profile?.average_rating?.toFixed(1) || "N/A"}/5.0</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="font-medium">${profile?.hourly_rate || "25"}/hour</p>
                  </div>
                </>
              )}
            </div>
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
