import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ProfileAvatarCard } from "@/components/profile-editor/ProfileAvatarCard";
import { StudentProfileForm } from "@/components/profile-editor/StudentProfileForm";
import { TutorProfileForm } from "@/components/profile-editor/TutorProfileForm";
import { CoursesSettings } from "./CoursesSettings";
import { useTutorProfile } from "@/hooks/useTutorProfile";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ProfileSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  // Track current profile view (can be different from actual role)
  const [profileView, setProfileView] = useState<'student' | 'tutor'>(profile?.role || 'student');
  
  const tutorProfileHook = useTutorProfile(profile);
  const studentProfileHook = useStudentProfile(profile);

  // Use the appropriate hook based on profile view
  const {
    loading,
    formData,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    avatarFile,
    setAvatarFile,
    handleInputChange,
    handleProfileUpdate,
  } = profileView === 'tutor' ? tutorProfileHook : studentProfileHook;

  const handleRoleToggle = async (newRole: 'student' | 'tutor') => {
    if (!updateProfile) return;
    
    try {
      // Update profile view immediately for UI responsiveness
      setProfileView(newRole);
      
      // Update role in database
      const result = await updateProfile({ role: newRole });
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: `Successfully switched to ${newRole} profile`,
        });
      } else {
        // Revert profile view if update failed
        setProfileView(profile?.role || 'student');
        toast({
          title: "Error",
          description: "Failed to update profile role",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert profile view if error occurred
      setProfileView(profile?.role || 'student');
      toast({
        title: "Error",
        description: "Failed to update profile role",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  const isTutor = profileView === 'tutor';
  const isStudent = profileView === 'student';

  return (
    <div className="space-y-6">
      {/* Profile View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            Profile View
            <div className="flex gap-2">
              <Button
                variant={isStudent ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('student')}
                disabled={loading}
              >
                Student
              </Button>
              <Button
                variant={isTutor ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleToggle('tutor')}
                disabled={loading}
              >
                Tutor
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {isTutor 
              ? "You have access to tutor features and can manage your tutoring profile." 
              : "You can browse tutors and book sessions. Want to become a tutor? Apply to get approved first."
            }
          </CardDescription>
        </CardHeader>
        {!isTutor && (
          <CardContent>
            <Button asChild variant="outline">
              <a 
                href="https://usc.qualtrics.com/jfe/form/SV_7QU9OKorLMDmxNk" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Apply to Become a Tutor
              </a>
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {isTutor ? (
            <TutorProfileForm
              formData={formData as any}
              handleInputChange={handleInputChange}
              loading={loading}
              uploadingAvatar={uploadingAvatar}
              handleProfileUpdate={handleProfileUpdate}
              userEmail={user.email}
              approvedTutor={profile.approved_tutor}
            />
          ) : (
            <StudentProfileForm
              formData={formData as any}
              handleInputChange={handleInputChange}
              loading={loading}
              uploadingAvatar={uploadingAvatar}
              handleProfileUpdate={handleProfileUpdate}
              userEmail={user.email}
            />
          )}
          
          {/* Course Settings Integration */}
          <CoursesSettings profileView={profileView} />
        </div>
        
        <div className="lg:col-span-1">
          <ProfileAvatarCard 
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
    </div>
  );
};
