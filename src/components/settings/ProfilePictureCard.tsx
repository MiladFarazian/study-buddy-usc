
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ImageCropper } from "@/components/ui/image-cropper";

interface ProfilePictureCardProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAvatarFile: (file: File | null) => void;
  avatarFile: File | null;
  loading: boolean;
  uploadingAvatar: boolean;
  firstName: string;
  userEmail?: string;
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

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setAvatarUrl(null);
      setAvatarFile(null);
      
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
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || ""} alt="Profile" />
              <AvatarFallback className="bg-usc-cardinal text-white text-xl">
                {getInitials(firstName || userEmail?.charAt(0) || "U")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-2">
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
                disabled={uploadingAvatar || loading}
              >
                <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
                  <Upload className="mr-2 h-4 w-4" />
                  {avatarFile ? "Change Image" : "Upload New Photo"}
                </label>
              </Button>
            </div>
            
            {(avatarUrl || profile?.avatar_url) && (
              <Button 
                variant="outline" 
                className="text-red-500 hover:text-red-600"
                onClick={removeAvatar}
                disabled={uploadingAvatar || loading}
              >
                <X className="mr-2 h-4 w-4" />
                Remove Photo
              </Button>
            )}
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
