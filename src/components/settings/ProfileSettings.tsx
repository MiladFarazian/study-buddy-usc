import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ProfileAvatarCard } from "@/components/profile-editor/ProfileAvatarCard";
import { StudentProfileForm } from "@/components/profile-editor/StudentProfileForm";
import { TutorProfileForm } from "@/components/profile-editor/TutorProfileForm";
import { useTutorProfile } from "@/hooks/useTutorProfile";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ProfileSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  // State to track which profile view is active
  const [activeTab, setActiveTab] = useState<'student' | 'tutor'>(profile?.role || 'student');
  
  // Always initialize both profile hooks
  const tutorProfileHook = useTutorProfile(profile);
  const studentProfileHook = useStudentProfile(profile);

  if (!user || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  const isTutor = profile.role === 'tutor';
  const isStudent = profile.role === 'student';

  // Get the appropriate hook data based on active tab
  const activeProfileHook = activeTab === 'tutor' ? tutorProfileHook : studentProfileHook;
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
  } = activeProfileHook;

  return (
    <div className="space-y-6">
      {/* Role Badge */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Role
            <Badge variant={isTutor ? "default" : "secondary"}>
              {profile.role === 'tutor' ? 'Tutor' : 'Student'}
            </Badge>
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

      {/* Profile Forms with Toggle */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'student' | 'tutor')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Student Profile</TabsTrigger>
          <TabsTrigger value="tutor">Tutor Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="student" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <StudentProfileForm
                formData={studentProfileHook.formData as any}
                handleInputChange={studentProfileHook.handleInputChange}
                loading={studentProfileHook.loading}
                uploadingAvatar={studentProfileHook.uploadingAvatar}
                handleProfileUpdate={studentProfileHook.handleProfileUpdate}
                userEmail={user.email}
              />
            </div>
            
            <div className="lg:col-span-1">
              <ProfileAvatarCard 
                avatarUrl={studentProfileHook.avatarUrl}
                setAvatarUrl={studentProfileHook.setAvatarUrl}
                setAvatarFile={studentProfileHook.setAvatarFile}
                avatarFile={studentProfileHook.avatarFile}
                loading={studentProfileHook.loading}
                uploadingAvatar={studentProfileHook.uploadingAvatar}
                firstName={studentProfileHook.formData.first_name}
                userEmail={user?.email}
                setUploadingAvatar={studentProfileHook.setUploadingAvatar}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tutor" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TutorProfileForm
                formData={tutorProfileHook.formData as any}
                handleInputChange={tutorProfileHook.handleInputChange}
                loading={tutorProfileHook.loading}
                uploadingAvatar={tutorProfileHook.uploadingAvatar}
                handleProfileUpdate={tutorProfileHook.handleProfileUpdate}
                userEmail={user.email}
                approvedTutor={profile.approved_tutor}
              />
            </div>
            
            <div className="lg:col-span-1">
              <ProfileAvatarCard 
                avatarUrl={tutorProfileHook.avatarUrl}
                setAvatarUrl={tutorProfileHook.setAvatarUrl}
                setAvatarFile={tutorProfileHook.setAvatarFile}
                avatarFile={tutorProfileHook.avatarFile}
                loading={tutorProfileHook.loading}
                uploadingAvatar={tutorProfileHook.uploadingAvatar}
                firstName={tutorProfileHook.formData.first_name}
                userEmail={user?.email}
                setUploadingAvatar={tutorProfileHook.setUploadingAvatar}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
