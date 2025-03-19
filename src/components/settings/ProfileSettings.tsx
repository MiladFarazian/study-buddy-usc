
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ProfilePictureCard } from "./ProfilePictureCard";
import { Loader2 } from "lucide-react";

type ProfileUpdateDto = Database['public']['Tables']['profiles']['Update'];
type UserRole = Database['public']['Enums']['user_role'];

export const ProfileSettings = () => {
  const { user, profile, isStudent, isTutor, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    major: profile?.major || "",
    graduation_year: profile?.graduation_year || "",
    bio: profile?.bio || "",
    role: profile?.role || "student" as UserRole,
    hourly_rate: profile?.hourly_rate?.toString() || "",
    subjects: profile?.subjects || [] as string[],
  });

  // Profile picture states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return null;
    
    try {
      setUploadingAvatar(true);
      
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

  const handleRoleChange = async (role: UserRole) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const updateData: ProfileUpdateDto = { role };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: `Your role has been updated to ${role}`,
      });

      setFormData((prev) => ({
        ...prev,
        role,
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First upload the avatar if there is one
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
        if (!newAvatarUrl) {
          // If avatar upload failed, don't proceed with profile update
          setLoading(false);
          return;
        }
      }
      
      const updateData: ProfileUpdateDto = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        major: formData.major,
        graduation_year: formData.graduation_year,
        bio: formData.bio,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString(),
      };
      
      if (formData.role === 'tutor' && formData.hourly_rate) {
        updateData.hourly_rate = parseFloat(formData.hourly_rate);
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Update local profile state
      if (updateProfile) {
        updateProfile({
          ...profile,
          ...updateData,
        });
      }
      
      setAvatarFile(null);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and how it appears on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name" 
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Your first name" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name" 
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Your last name" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ""} 
              placeholder="your.email@usc.edu" 
              readOnly 
            />
            <p className="text-sm text-muted-foreground">
              Your email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">User Role</Label>
            <div className="flex items-center space-x-4">
              <Button 
                variant={isStudent ? "default" : "outline"}
                onClick={() => handleRoleChange("student")}
                disabled={loading || isStudent}
                className={isStudent ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
              >
                Student
              </Button>
              <Button 
                variant={isTutor ? "default" : "outline"}
                onClick={() => handleRoleChange("tutor")}
                disabled={loading || isTutor}
                className={isTutor ? "bg-usc-cardinal hover:bg-usc-cardinal-dark" : ""}
              >
                Tutor
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose whether you want to find tutors or be a tutor
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="major">Major</Label>
            <Input 
              id="major" 
              name="major"
              value={formData.major}
              onChange={handleInputChange}
              placeholder="Computer Science" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="graduation_year">Graduation Year</Label>
            <Input 
              id="graduation_year" 
              name="graduation_year"
              value={formData.graduation_year}
              onChange={handleInputChange}
              placeholder="2026" 
            />
          </div>
          
          {isTutor && (
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input 
                id="hourly_rate" 
                name="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                placeholder="25" 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..." 
            />
          </div>
          
          <Button 
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark"
            onClick={handleProfileUpdate}
            disabled={loading || uploadingAvatar}
          >
            {(loading || uploadingAvatar) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
      
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
        />
      </div>
    </div>
  );
};
