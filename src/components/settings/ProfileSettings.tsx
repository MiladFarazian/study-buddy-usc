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

export const ProfileSettings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const tutorProfileHook = useTutorProfile(profile?.role === 'tutor' ? profile : null);
  const studentProfileHook = useStudentProfile(profile?.role === 'student' ? profile : null);

  // Use the appropriate hook based on user role
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
  } = profile?.role === 'tutor' ? tutorProfileHook : studentProfileHook;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
